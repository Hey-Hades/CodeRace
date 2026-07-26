import { declareWinner } from "./match.controller.js";
import supabase from "../config/supabase.js";

const activeRooms = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  socket.on(
    "create_room",
    async ({ difficulty, company, matchType, playerName, userId }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      try {
        const { data: roomData, error: roomError } = await supabase
          .from("rooms")
          .insert([
            {
              room_code: roomCode,
              created_by: userId || null,
              match_type: matchType,
              difficulty: difficulty,
              company: company,
              status: "waiting",
            },
          ])
          .select("id")
          .single();

        if (roomError) throw roomError;
        const dbRoomId = roomData.id;

        const { error: partError } = await supabase
          .from("room_participants")
          .insert([
            {
              room_id: dbRoomId,
              user_id: userId || null,
              user_name: !userId ? playerName : null,
              is_ready: false,
            },
          ]);

        if (partError) throw partError;

        activeRooms.set(roomCode, {
          dbId: dbRoomId,
          settings: { difficulty, company, matchType },
          players: [
            {
              id: socket.id,
              userId: userId || null,
              name: playerName,
              isReady: false,
              progress: 0,
              disconnected: false,
            },
          ],
          problem: null,
          status: "waiting",
          startTime: null,
        });

        socket.join(roomCode);
        socket.emit("room_created", { roomId: roomCode });
        console.log(
          `🏠 Room created: [${roomCode}] mapped to UUID [${dbRoomId}]`,
        );

        setTimeout(
          async () => {
            const room = activeRooms.get(roomCode);
            if (
              room &&
              room.players.length === 1 &&
              room.status === "waiting" &&
              room.settings.matchType !== "practice"
            ) {
              io.to(roomCode).emit("room_error", {
                message: "Room expired. No opponent joined.",
              });
              io.in(roomCode).socketsLeave(roomCode);
              activeRooms.delete(roomCode);

              await supabase
                .from("rooms")
                .update({ status: "expired" })
                .eq("id", dbRoomId);
            }
          },
          5 * 60 * 1000,
        );
      } catch (error) {
        console.error("Database error creating room:", error);
        socket.emit("room_error", {
          message: "Failed to initialize room in database.",
        });
      }
    },
  );

  socket.on("join_room", async ({ roomId, playerName, userId }) => {
    const roomCode = roomId;
    const room = activeRooms.get(roomCode);

    if (!room)
      return socket.emit("room_error", {
        message: "Room not found or expired.",
      });
    if (room.settings.matchType === "practice")
      return socket.emit("room_error", {
        message: "Cannot join a practice room.",
      });
    if (room.players.length >= 2)
      return socket.emit("room_error", { message: "Room is already full." });
    if (room.status !== "waiting")
      return socket.emit("room_error", {
        message: "Match already in progress.",
      });

    try {
      const { error: partError } = await supabase
        .from("room_participants")
        .insert([
          {
            room_id: room.dbId,
            user_id: userId || null,
            user_name: !userId ? playerName : null,
            is_ready: false,
          },
        ]);

      if (partError) throw partError;

      room.players.push({
        id: socket.id,
        userId: userId || null,
        name: playerName,
        isReady: false,
        progress: 0,
        disconnected: false,
      });
      socket.join(roomCode);

      socket.emit("room_joined", {
        roomId: roomCode,
        creatorName: room.players[0].name,
        difficulty: room.settings.difficulty,
        company: room.settings.company,
        matchType: room.settings.matchType,
      });

      socket.to(roomCode).emit("player_joined", { joinerName: playerName });
      console.log(`⚔️ ${playerName} joined room ${roomCode}`);
    } catch (error) {
      console.error("Database error joining room:", error);
      socket.emit("room_error", {
        message: "Failed to register player in database.",
      });
    }
  });

  socket.on("toggle_ready", async ({ roomId, isReady }) => {
    const room = activeRooms.get(roomId);
    if (!room) return;

    let player = room.players.find((p) => p.id === socket.id);

    if (
      !player &&
      room.settings.matchType === "practice" &&
      room.players.length > 0
    ) {
      room.players[0].id = socket.id;
      player = room.players[0];
    }

    if (player) {
      player.isReady = isReady;
      let readyQuery = supabase
        .from("room_participants")
        .update({ is_ready: isReady })
        .eq("room_id", room.dbId);

      if (player.userId) {
        readyQuery = readyQuery.eq("user_id", player.userId);
      } else {
        readyQuery = readyQuery.eq("user_name", player.name);
      }
      readyQuery.then(({ error }) => {
        if (error) console.error("Failed to sync ready status:", error.message);
      });
    } else {
      return;
    }

    io.to(roomId).emit("player_ready_status", { playerId: socket.id, isReady });

    const isPractice = room.settings.matchType === "practice";
    const isReadyToStart = isPractice
      ? room.players.length === 1 && room.players[0].isReady
      : room.players.length === 2 && room.players.every((p) => p.isReady);

    if (isReadyToStart && room.status === "waiting") {
      room.status = "active";
      console.log(`🏁 Match starting in ${roomId}. Fetching problem...`);

      try {
        const dbDiff =
          room.settings.difficulty === "med"
            ? "medium"
            : room.settings.difficulty;

        let query = supabase
          .from("problems")
          .select("*")
          .eq("difficulty", dbDiff)
          .eq("available", true)
          .not("description", "is", null)
          .neq("description", "")
          .not("code_snippets", "is", null);

        if (room.settings.company !== "All") {
          query = query.contains("companies", [
            room.settings.company.toLowerCase(),
          ]);
        }

        const { data: problems, error } = await query;
        if (error) throw error;

        const selectedProblem =
          problems && problems.length > 0
            ? problems[Math.floor(Math.random() * problems.length)]
            : null;

        if (!selectedProblem) {
          io.to(roomId).emit("room_error", {
            message: "No problem found matching those settings.",
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

        supabase
          .from("rooms")
          .update({
            status: "in_progress",
            problem_id: selectedProblem.id,
          })
          .eq("id", room.dbId)
          .then(({ error }) => {
            if (error)
              console.error("Failed to save problem_id:", error.message);
          });

        if (isPractice) {
          room.startTime = Date.now() + 3000;
          socket.emit("problem_data", selectedProblem);
          socket.emit("start_countdown", { startTime: room.startTime });
        } else {
          io.to(roomId).emit("match_started", {
            roomId,
            difficulty: room.settings.difficulty,
            company: room.settings.company,
            matchType: room.settings.matchType,
          });

          setTimeout(() => {
            room.startTime = Date.now() + 3000;
            io.to(roomId).emit("problem_data", selectedProblem);
            io.to(roomId).emit("start_countdown", {
              startTime: room.startTime,
            });
          }, 1500);
        }
      } catch (err) {
        console.error("Database error fetching problem:", err.message);
        io.to(roomId).emit("room_error", {
          message: "Failed to load problem from database.",
        });
      }
    }
  });

  socket.on("rejoin_room", ({ roomId }) => {
    const room = activeRooms.get(roomId);
    if (!room)
      return socket.emit("room_error", { message: "Room expired or closed." });

    const player = room.players.find((p) => p.disconnected);
    if (player) {
      player.id = socket.id;
      player.disconnected = false;
    }

    socket.join(roomId);

    if (room.status === "active" && room.problem) {
      socket.emit("problem_data", room.problem);
      socket.emit("start_countdown", { startTime: room.startTime });
    }
  });

  socket.on("progress_update", ({ roomId, progress }) => {
    socket.to(roomId).emit("opponent_progress", { progress });
  });

  socket.on("player_won", async ({ roomId, executionTimeMs }) => {
    const room = activeRooms.get(roomId);

    if (room && room.status === "active") {
      room.status = "finished";
      io.to(roomId).emit("match_over", { winnerId: socket.id });

      try {
        await supabase
          .from("rooms")
          .update({ status: "completed" })
          .eq("id", room.dbId);

        const winner = room.players.find((p) => p.id === socket.id);
        const loser = room.players.find((p) => p.id !== socket.id);
        for (const player of room.players) {
          if (player.userId) {
            const isWinner = player.id === winner.id;
            await supabase.rpc("update_user_match_stats", {
              target_user_id: player.userId,
              is_win: isWinner,
            });
          }
        }

        const isRankedMatch =
          room.players.length === 2 &&
          room.players[0].userId !== null &&
          room.players[1].userId !== null;

        if (isRankedMatch) {
          const problemId = room.problem?.id || "two-sum";
          const result = await declareWinner(
            room.dbId,
            socket.id,
            problemId,
            executionTimeMs || 0,
          );
          if (result && result.success) {
            console.log(
              `🏆 Ranked Match finalized! ELO Exchanged: +${result.pointsExchanged}`,
            );
          }
        } else {
          console.log(
            `🤝 Unrated Match finalized. Stats saved, no ELO exchanged.`,
          );
        }
      } catch (dbError) {
        console.error(
          "Failed to process Match Finish transaction:",
          dbError.message,
        );
      }

      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  });

  const handleLeave = (roomId, currentSocketId) => {
    const room = activeRooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex((p) => p.id === currentSocketId);
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);

      if (room.players.length === 0) {
        supabase
          .from("rooms")
          .update({ status: "abandoned" })
          .eq("id", room.dbId)
          .then();
        activeRooms.delete(roomId);
      } else {
        io.to(roomId).emit("opponent_left_handshake");
        room.players[0].isReady = false;
        room.status = "waiting";
      }
    }
  };

  socket.on("leave_room", (data) => {
    if (!data || !data.roomId) return;
    handleLeave(data.roomId, socket.id);
    socket.leave(data.roomId);
  });

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);

    for (const [roomId, room] of activeRooms.entries()) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.disconnected = true;

        setTimeout(() => {
          const checkRoom = activeRooms.get(roomId);
          if (checkRoom) {
            const checkPlayer = checkRoom.players.find(
              (p) => p.id === socket.id && p.disconnected,
            );
            if (checkPlayer) {
              handleLeave(roomId, socket.id);
            }
          }
        }, 10000);
      }
    }
  });

  // Ping System
  socket.on("get_ping", (timestamp) => {
    socket.emit("pong_returned", timestamp);
  });
};
