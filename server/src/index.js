import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { problems } from "./problems.js";
import { createRoom, getPublicRoom, joinRoom, rooms, setRoomDifficulty, startRoom } from "./rooms.js";
import { reviewMatch, makeHint } from "./services/ai.js";
import { getIntegrationStatus, saveHintLog, saveMatchResult, saveSubmission } from "./services/database.js";
import { judgeSubmission } from "./services/judge.js";
import { calculateScore, HINT_PENALTIES, TIME_LIMIT_SECONDS } from "./scoring.js";

const app = express();
const port = process.env.PORT || 4000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true, rooms: rooms.size, integrations: getIntegrationStatus() });
});

app.get("/integrations", (_req, res) => {
  res.json(getIntegrationStatus());
});

app.get("/problems", (_req, res) => {
  res.json(problems.map(({ testCases, ...problem }) => problem));
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  socket.on("create-room", ({ name }) => {
    const { room, player } = createRoom(name, socket.id);
    socket.join(room.code);
    socket.emit("room-created", { room: getPublicRoom(room.code), playerId: player.id });
  });

  socket.on("join-room", ({ roomCode, name }) => {
    try {
      const { room, player } = joinRoom(roomCode, name, socket.id);
      socket.join(room.code);
      socket.emit("joined-room", { room: getPublicRoom(room.code), playerId: player.id });
      io.to(room.code).emit("room-updated", { room: getPublicRoom(room.code) });
    } catch (error) {
      socket.emit("action-error", { message: error.message });
    }
  });

  socket.on("start-race", ({ roomCode }) => {
    try {
      const room = startRoom(roomCode);
      io.to(room.code).emit("race-started", {
        room: getPublicRoom(room.code),
        problem: publicProblem(room.problem),
        timeLimitSeconds: TIME_LIMIT_SECONDS
      });
    } catch (error) {
      socket.emit("action-error", { message: error.message });
    }
  });

  socket.on("set-difficulty", ({ roomCode, difficulty }) => {
    try {
      const room = setRoomDifficulty(roomCode, difficulty, socket.id);
      io.to(room.code).emit("room-updated", { room: getPublicRoom(room.code) });
    } catch (error) {
      socket.emit("action-error", { message: error.message });
    }
  });

  socket.on("submit-code", async ({ roomCode, code, language }) => {
    try {
      const room = rooms.get(normalizeRoomCode(roomCode));
      if (!room || room.status !== "racing") throw new Error("Race is not active.");

      const player = room.players.find((candidate) => candidate.socketId === socket.id);
      if (!player) throw new Error("Player not found in this room.");

      const progress = room.progress[player.id];
      progress.submissions += 1;
      progress.status = "Judging";
      io.to(room.code).emit("progress-update", { room: getPublicRoom(room.code) });

      const judgeResult = await judgeSubmission({
        problem: room.problem,
        code,
        language
      });

      progress.passedTests = judgeResult.passedTests;
      progress.totalTests = judgeResult.totalTests;
      progress.status = judgeResult.status || (judgeResult.accepted ? "Accepted" : "Wrong Answer");
      progress.lastSubmittedAt = Date.now();
      progress.code = code;
      progress.language = language;

      await saveSubmission({
        room,
        player,
        progress,
        judgeResult,
        code,
        language
      });

      if (judgeResult.accepted && !room.firstSolverId) {
        room.firstSolverId = player.id;
      }

      if (judgeResult.accepted) {
        room.status = "finished";
        const result = await buildResult(room, player.id);
        io.to(room.code).emit("race-ended", { result, room: getPublicRoom(room.code) });
        return;
      }

      io.to(room.code).emit("progress-update", { room: getPublicRoom(room.code) });
    } catch (error) {
      socket.emit("action-error", { message: error.message });
    }
  });

  socket.on("request-hint", async ({ roomCode, hintType }) => {
    try {
      const room = rooms.get(normalizeRoomCode(roomCode));
      if (!room || room.status !== "racing") throw new Error("Race is not active.");

      const player = room.players.find((candidate) => candidate.socketId === socket.id);
      if (!player) throw new Error("Player not found in this room.");

      const penalty = HINT_PENALTIES[hintType] || HINT_PENALTIES.basic;
      room.progress[player.id].hintPenalty += penalty;
      room.progress[player.id].hintsUsed += 1;

      const hint = await makeHint(room.problem, hintType);
      await saveHintLog({ room, player, hintType, penalty, hint });
      socket.emit("hint-response", { hint, room: getPublicRoom(room.code) });
      io.to(room.code).emit("progress-update", { room: getPublicRoom(room.code) });
    } catch (error) {
      socket.emit("action-error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    for (const room of rooms.values()) {
      const player = room.players.find((candidate) => candidate.socketId === socket.id);
      if (player) {
        player.connected = false;
        io.to(room.code).emit("room-updated", { room: getPublicRoom(room.code) });
      }
    }
  });
});

async function buildResult(room, winnerId) {
  const finishedAt = Date.now();
  const players = room.players.map((player) => {
    const progress = room.progress[player.id];
    return {
      id: player.id,
      name: player.name,
      passedTests: progress.passedTests,
      totalTests: progress.totalTests,
      hintsUsed: progress.hintsUsed,
      hintPenalty: progress.hintPenalty,
      submissions: progress.submissions,
      score: calculateScore({
        startedAt: room.startedAt,
        finishedAt,
        firstSolver: room.firstSolverId === player.id,
        progress
      })
    };
  });

  players.sort((a, b) => b.score - a.score);
  const winner = players.find((player) => player.id === winnerId) || players[0];
  const review = await reviewMatch(room, players);

  const result = {
    winnerId: winner.id,
    winnerName: winner.name,
    players,
    review
  };

  await saveMatchResult({ room, result, finishedAt });

  return result;
}

function publicProblem(problem) {
  const { testCases, ...safeProblem } = problem;
  return safeProblem;
}

function normalizeRoomCode(roomCode) {
  return String(roomCode || "").trim().toUpperCase();
}

httpServer.listen(port, () => {
  console.log(`CodeRace server running on http://localhost:${port}`);
});
