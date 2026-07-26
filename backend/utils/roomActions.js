import { socketAsync } from "./asyncHandler.js";

export const handleCreateRoom = socketAsync(async (io, socket, data) => {


    async ({ difficulty, company, matchType, playerName, userId }) => {
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        console.log(difficulty, company, matchType, playerName, userId);
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
     
    },
  );

