import { problems } from "./problems.js";

export const rooms = new Map();

export function createRoom(name, socketId) {
  const code = makeRoomCode();
  const player = makePlayer(name, socketId);
  const room = {
    code,
    players: [player],
    status: "waiting",
    difficulty: "Easy",
    problem: null,
    startedAt: null,
    firstSolverId: null,
    progress: {
      [player.id]: makeProgress()
    }
  };

  rooms.set(code, room);
  return { room, player };
}

export function joinRoom(roomCode, name, socketId) {
  const code = normalizeRoomCode(roomCode);
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found.");
  if (room.status !== "waiting") throw new Error("This race has already started.");
  if (room.players.length >= 2) throw new Error("Room is full.");

  const player = makePlayer(name, socketId);
  room.players.push(player);
  room.progress[player.id] = makeProgress();

  return { room, player };
}

export function startRoom(roomCode) {
  const code = normalizeRoomCode(roomCode);
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found.");
  if (room.players.length < 2) throw new Error("Need two players to start.");

  room.status = "racing";
  room.problem = pickProblem(room.difficulty);
  room.startedAt = Date.now();
  for (const progress of Object.values(room.progress)) {
    progress.totalTests = room.problem.testCases.length;
    progress.status = "Racing";
  }
  return room;
}

export function setRoomDifficulty(roomCode, difficulty, socketId) {
  const code = normalizeRoomCode(roomCode);
  const room = rooms.get(code);
  if (!room) throw new Error("Room not found.");
  if (room.status !== "waiting") throw new Error("Difficulty cannot change after the race starts.");
  if (room.players[0]?.socketId !== socketId) throw new Error("Only the room creator can change difficulty.");

  const normalized = normalizeDifficulty(difficulty);
  room.difficulty = normalized;
  return room;
}

export function getPublicRoom(roomCode) {
  const room = rooms.get(normalizeRoomCode(roomCode));
  if (!room) return null;

  return {
    code: room.code,
    status: room.status,
    difficulty: room.difficulty,
    startedAt: room.startedAt,
    players: room.players.map(({ id, name, connected }) => ({ id, name, connected })),
    progress: Object.fromEntries(
      Object.entries(room.progress).map(([playerId, progress]) => [
        playerId,
        {
          passedTests: progress.passedTests,
          totalTests: progress.totalTests,
          submissions: progress.submissions,
          hintsUsed: progress.hintsUsed,
          hintPenalty: progress.hintPenalty,
          status: progress.status
        }
      ])
    )
  };
}

function makePlayer(name, socketId) {
  return {
    id: crypto.randomUUID(),
    name: String(name || "Player").trim().slice(0, 24) || "Player",
    socketId,
    connected: true
  };
}

function makeProgress() {
  return {
    passedTests: 0,
    totalTests: 5,
    submissions: 0,
    hintsUsed: 0,
    hintPenalty: 0,
    status: "Waiting",
    code: "",
    language: "javascript",
    lastSubmittedAt: null
  };
}

function pickProblem(difficulty) {
  const candidates = problems.filter((problem) => problem.difficulty === difficulty);
  return candidates[Math.floor(Math.random() * candidates.length)] || problems[0];
}

function normalizeDifficulty(difficulty) {
  const value = String(difficulty || "Easy").trim();
  return ["Easy", "Medium", "Hard"].includes(value) ? value : "Easy";
}

function makeRoomCode() {
  let code = "";
  do {
    code = `RACE${Math.floor(100 + Math.random() * 900)}`;
  } while (rooms.has(code));
  return code;
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}
