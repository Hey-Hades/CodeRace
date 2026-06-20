import { declareWinner } from './match.controller.js';
import supabase from '../config/supabase.js';

const activeRooms = new Map();

export const handleSocketConnection = (io, socket) => {
  console.log(`🟢 Socket connected: ${socket.id}`);

  // 1. Create a Room (Now ASYNC to fetch from DB)
  socket.on("create_room", async ({ difficulty, matchType }) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Fetch all problems from DB that match the chosen difficulty
    const { data: problems, error } = await supabase
        .from('problems')
        .select('*')
        .eq('difficulty', difficulty.toLowerCase());

    if (error) {
        console.error("Error fetching problems:", error.message);
    }

    // Pick a random problem from the list
    const selectedProblem = (problems && problems.length > 0) 
        ? problems[Math.floor(Math.random() * problems.length)] 
        : null;
    
    // Store the selected problem in the room's memory
    activeRooms.set(roomId, {
      players: [socket.id],
      readyPlayers: new Set(), 
      difficulty,
      matchType,
      problem: selectedProblem, // <-- Saved here!
      status: "waiting"
    });

    socket.join(roomId);
    socket.emit("room_created", { roomId });
    console.log(`🏠 Room created: ${roomId} (Type: ${matchType}, Problem: ${selectedProblem?.title || 'Fallback'})`);

    setTimeout(() => {
      const room = activeRooms.get(roomId);
      if (room && room.status === "waiting") {
        io.to(roomId).emit("room_expired", { message: "Room expired. No opponent joined." });
        io.in(roomId).socketsLeave(roomId);
        activeRooms.delete(roomId);
      }
    }, 60 * 1000); 
  });

  // 2. Join a Room
  socket.on("join_room", ({ roomId }) => {
    const room = activeRooms.get(roomId);

    if (!room) return socket.emit("room_error", { message: "Room not found or expired." });
    if (room.status !== "waiting") return socket.emit("room_error", { message: "Match already in progress." });

    room.players.push(socket.id);
    room.status = "active";
    socket.join(roomId);

    console.log(`⚔️ Match started in room: ${roomId}. Sending problem: ${room.problem?.title}`);
    
    // BLAST THE PROBLEM TO BOTH PLAYERS SO THE UI CAN RENDER IT
    io.to(roomId).emit("match_started", { 
      roomId, 
      difficulty: room.difficulty,
      matchType: room.matchType,
      problem: room.problem // <-- Passes dynamic data to the frontend!
    });
  });

  // 3. The Synchronized Start Handshake
  socket.on("player_ready", ({ roomId }) => {
    const room = activeRooms.get(roomId);
    if (room && room.status === "active") {
      room.readyPlayers.add(socket.id);
      
      if (room.readyPlayers.size === 2) {
        console.log(`🏁 Both players clicked ready in ${roomId}. Booting countdown!`);
        io.to(roomId).emit("start_countdown", { seconds: 3 });
      }
    }
  });

  // 4. Sync Player Progress
  socket.on("progress_update", ({ roomId, progress }) => {
    socket.to(roomId).emit("opponent_progress", { progress, playerId: socket.id });
  });

  // 5. Match Won (V2 ELO INTEGRATION)
  socket.on("player_won", async ({ roomId, problemId, executionTimeMs }) => {
    const room = activeRooms.get(roomId);
    
    if (room && room.status === "active") {
      room.status = "finished";
      
      // Instantly tell the frontend the match is over for snappiness
      io.to(roomId).emit("match_over", { winnerId: socket.id });
      
      try {
        // Run the heavy V2 ELO calculations in the background
        const result = await declareWinner(roomId, socket.id, problemId || 'two-sum', executionTimeMs || 0);
        if (result.success) {
           console.log(`🏆 Match finalized! ELO Exchanged: +${result.pointsExchanged}`);
        }
      } catch (dbError) {
        console.error("Failed to process V2 ELO engine transaction:", dbError.message);
      }
      
      io.in(roomId).socketsLeave(roomId);
      activeRooms.delete(roomId);
    }
  });

  // 6. Safe Cleanup
  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
    for (const [roomId, room] of activeRooms.entries()) {
      if (room.players.includes(socket.id)) {
        if (room.status === "active" && room.readyPlayers.has(socket.id)) {
          room.readyPlayers.delete(socket.id);
          socket.to(roomId).emit("opponent_left_handshake");
        }
      }
    }
  });
};