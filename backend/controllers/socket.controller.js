import { declareWinner } from "./match.controller.js";
import supabase from "../config/supabase.js";

const activeRooms = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // --- 1. CREATE A ROOM ---
  socket.on("create_room", ({ difficulty, company, matchType, playerName }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Store all the settings, but DO NOT fetch the problem yet.
    // We wait until both players are ready so we don't waste DB reads.
    activeRooms.set(roomId, {
      settings: { difficulty, company, matchType },
      players: [
        { id: socket.id, name: playerName, isReady: false, progress: 0 },
      ],
      problem: null,
      status: "waiting",
    });

    socket.join(roomId);
    socket.emit("room_created", { roomId });
    console.log(
      `🏠 Room created: ${roomId} by ${playerName} (Diff: ${difficulty}, Co: ${company})`,
    );

    // Clean up empty rooms after 5 minutes
    setTimeout(
      () => {
        const room = activeRooms.get(roomId);
        if (room && room.players.length === 1 && room.status === "waiting") {
          io.to(roomId).emit("room_error", {
            message: "Room expired. No opponent joined.",
          });
          io.in(roomId).socketsLeave(roomId);
          activeRooms.delete(roomId);
        }
      },
      5 * 60 * 1000,
    );
  });

  // --- 2. JOIN A ROOM ---
  socket.on("join_room", ({ roomId, playerName }) => {
    const room = activeRooms.get(roomId);

    if (!room)
      return socket.emit("room_error", {
        message: "Room not found or expired.",
      });
    if (room.players.length >= 2)
      return socket.emit("room_error", { message: "Room is already full." });
    if (room.status !== "waiting")
      return socket.emit("room_error", {
        message: "Match already in progress.",
      });

    room.players.push({
      id: socket.id,
      name: playerName,
      isReady: false,
      progress: 0,
    });
    socket.join(roomId);

    // Give the joiner the settings established by the creator
    socket.emit("room_joined", {
      roomId,
      creatorName: room.players[0].name,
      difficulty: room.settings.difficulty,
      company: room.settings.company,
      matchType: room.settings.matchType,
    });

    // Tell the creator who just joined
    socket.to(roomId).emit("player_joined", { joinerName: playerName });
    console.log(`⚔️ ${playerName} joined room ${roomId}`);
  });

  // --- 3. THE HANDSHAKE & PROBLEM FETCH ---
  socket.on("toggle_ready", async ({ roomId, isReady }) => {
    const room = activeRooms.get(roomId);
    if (!room) return;

    // Update readiness for the specific player
    const player = room.players.find((p) => p.id === socket.id);
    if (player) player.isReady = isReady;

    // Broadcast the status update to trigger the UI glow
    io.to(roomId).emit("player_ready_status", { playerId: socket.id, isReady });

    // Check if BOTH players are in and BOTH are ready
    if (
      room.players.length === 2 &&
      room.players.every((p) => p.isReady) &&
      room.status === "waiting"
    ) {
      room.status = "active";
      console.log(`🏁 Both players ready in ${roomId}. Fetching problem...`);

      try {
        // Map frontend diff state to database diff state
        const dbDiff =
          room.settings.difficulty === "med"
            ? "medium"
            : room.settings.difficulty;
        // let query = supabase.from('problems').select('*').eq('difficulty', dbDiff);
        let query = supabase
          .from("problems")
          .select("*")
          .eq("leetcode_id", "1");

        // Apply company filter if selected
        if (room.settings.company !== "All") {
          query = query.contains("companies", [
            room.settings.company.toLowerCase(),
          ]);
        }

        const { data: problems, error } = await query;

        if (error) throw error;

        // Pick a random problem from the valid list
        const selectedProblem =
          problems && problems.length > 0
            ? problems[Math.floor(Math.random() * problems.length)]
            : null;

        if (!selectedProblem) {
          io.to(roomId).emit("room_error", {
            message:
              "No problem found matching those exact settings. Try 'All Companies'.",
          });
          room.status = "waiting";
          room.players.forEach((p) => (p.isReady = false));
          io.to(roomId).emit("player_ready_status", {
            playerId: socket.id,
            isReady: false,
          });
          return;
        }

        room.problem = selectedProblem;

        // 1. Tell React to navigate to /race
        io.to(roomId).emit("match_started", {
          roomId,
          difficulty: room.settings.difficulty,
          company: room.settings.company,
          matchType: room.settings.matchType,
        });

        // 2. Wait for React to render, then drop the problem and start the GO! countdown
        setTimeout(() => {
          io.to(roomId).emit("problem_data", selectedProblem);
          io.to(roomId).emit("start_countdown", { seconds: 3 });
        }, 1500);
      } catch (err) {
        console.error("Database error fetching problem:", err.message);
        io.to(roomId).emit("room_error", {
          message: "Failed to load problem from database.",
        });
      }
    }
  });

  // --- 4. SYNC PLAYER PROGRESS ---
  socket.on("progress_update", ({ roomId, progress }) => {
    socket.to(roomId).emit("opponent_progress", { progress });
  });

  // --- 5. MATCH WON (V2 ELO INTEGRATION) ---
  socket.on("player_won", async ({ roomId, executionTimeMs }) => {
    const room = activeRooms.get(roomId);

    if (room && room.status === "active") {
      room.status = "finished";

      // Instantly tell the frontend the match is over for snappiness
      io.to(roomId).emit("match_over", { winnerId: socket.id });

      try {
        // Run the heavy V2 ELO calculations in the background
        const problemId = room.problem?.id || "two-sum";
        const result = await declareWinner(
          roomId,
          socket.id,
          problemId,
          executionTimeMs || 0,
        );

        if (result && result.success) {
          console.log(
            `🏆 Match finalized! ELO Exchanged: +${result.pointsExchanged}`,
          );
        }
      } catch (dbError) {
        console.error(
          "Failed to process V2 ELO engine transaction:",
          dbError.message,
        );
      }

      // Boot players and clear room
      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  });

  // --- 6. SAFE CLEANUP (LEAVE & DISCONNECT) ---
  const handleLeave = (roomId, currentSocketId) => {
    const room = activeRooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === currentSocketId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      socket.leave(roomId);

      if (room.players.length === 0) {
        activeRooms.delete(roomId);
      } else {
        // Opponent left, cancel readiness
        io.to(roomId).emit("opponent_left_handshake");
        room.players[0].isReady = false;
        room.status = "waiting";
      }
    }
  };

  socket.on("leave_room", ({ roomId }) => {
    handleLeave(roomId, socket.id);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    for (const roomId of activeRooms.keys()) {
      handleLeave(roomId, socket.id);
    }
  });
};

