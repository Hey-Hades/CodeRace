import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/user.route.js";
import codeRoutes from "./routes/code.route.js";
import aiRoutes from "./routes/ai.route.js";
import { handleSocketConnection } from "./controllers/socket.controller.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
const httpServer = createServer(app);

const origin = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "http://localhost:5174",
  "https://coderace-live.vercel.app",
];

const io = new Server(httpServer, {
  cors: {
    origin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.io = io;

app.use(
  cors({
    origin,
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.use("/api/code", codeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/ai", aiRoutes);

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "healthy", platform: "CodeRace" });
});

io.on("connection", (socket) => handleSocketConnection(io, socket));

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 CodeRace backend running on port ${PORT}`);
});
