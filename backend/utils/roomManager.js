const activeRooms = new Map();

export const RoomManager = {
  get: (code) => activeRooms.get(code),
  set: (code, data) => activeRooms.set(code, data),
  delete: (code) => activeRooms.delete(code),
  entries: () => activeRooms.entries(),

  createRoomData: (
    dbId,
    difficulty,
    company,
    matchType,
    socketId,
    userId,
    playerName,
  ) => ({
    dbId,
    settings: { difficulty, company, matchType },
    players: [
      {
        id: socketId,
        userId,
        name: playerName,
        isReady: false,
        progress: 0,
        disconnected: false,
      },
    ],
    problem: null,
    status: "waiting",
    startTime: null,
  }),
};
