import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/user.route.js";
import codeRoutes from "./routes/code.route.js";
import aiRoutes from "./routes/ai.route.js";
import { handleSocketConnection } from "./controllers/socket.controller.js";
import { setIo } from "./utils/io.js";
import { initCronJobs } from "./cron/testCaseGenerator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);

// ─── BACKGROUND JOBS ──────────────────────────────────────────────────────────
initCronJobs();

// ─── CORS origins ─────────────────────────────────────────────────────────────
// Always allow both known Vercel deployments + localhost for dev.
// Set CLIENT_URL on Render's dashboard if you deploy to a different domain.
const ALLOWED_ORIGINS = [
  "https://coderace-app.vercel.app",       // primary production URL
  "https://coderace-live.vercel.app",      // legacy / preview URL
  "http://localhost:5173",                 // Vite dev server
  "http://localhost:5174",
];

if (process.env.CLIENT_URL) {
  ALLOWED_ORIGINS.push(process.env.CLIENT_URL);
}

const origin = (requestOrigin, callback) => {
  // Allow requests with no origin (e.g. Postman, curl, server-to-server)
  if (!requestOrigin) return callback(null, true);
  if (ALLOWED_ORIGINS.includes(requestOrigin)) return callback(null, true);
  callback(new Error(`CORS: origin '${requestOrigin}' is not allowed`));
};

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Store io via singleton module (replaces unsafe global.io)
setIo(io);

// ─── Security Middleware ──────────────────────────────────────────────────────
// Helmet sets sensible HTTP security headers in one line
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow Monaco editor CDN resources
}));

app.use(
  cors({
    origin,
    credentials: true,
  }),
);

app.use(express.json({ limit: "100kb" })); // cap request body size

// ─── Rate Limiters ────────────────────────────────────────────────────────────
// Code execution: max 15 submissions per minute per IP
const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many submissions. Please wait a moment before trying again." },
});

// AI review: max 5 reviews per minute per IP (Gemini quota protection)
const aiReviewLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "🏎️ Pit stop! Too many AI requests. Please wait 60 seconds." },
});

// General API: 100 requests per minute per IP
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please slow down." },
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/code", codeExecutionLimiter, codeRoutes);
app.use("/api/users", generalLimiter, userRoutes);
app.use("/api/ai", aiReviewLimiter, aiRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", platform: "CodeRace" });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => handleSocketConnection(io, socket));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 CodeRace backend running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
});
