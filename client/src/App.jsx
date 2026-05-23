import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  Bot,
  CheckCircle2,
  Clipboard,
  Clock,
  Code2,
  Flag,
  Loader2,
  Play,
  Rocket,
  Trophy,
  Users
} from "lucide-react";
import { socket } from "./socket";
import { languageLabels, starterCode } from "./problemTemplates";

const initialProgress = {};

function App() {
  const [screen, setScreen] = useState("home");
  const [name, setName] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Easy");
  const [room, setRoom] = useState(null);
  const [playerId, setPlayerId] = useState("");
  const [problem, setProblem] = useState(null);
  const [progress, setProgress] = useState(initialProgress);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [timeLeft, setTimeLeft] = useState(900);
  const [submitting, setSubmitting] = useState(false);
  const [hint, setHint] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    socket.connect();

    socket.on("room-created", ({ room: nextRoom, playerId: id }) => {
      setRoom(nextRoom);
      setSelectedDifficulty(nextRoom.difficulty || "Easy");
      setPlayerId(id);
      setScreen("lobby");
    });

    socket.on("room-updated", ({ room: nextRoom }) => {
      setRoom(nextRoom);
      setSelectedDifficulty(nextRoom.difficulty || "Easy");
      setProgress(nextRoom.progress || {});
    });

    socket.on("joined-room", ({ room: nextRoom, playerId: id }) => {
      setRoom(nextRoom);
      setSelectedDifficulty(nextRoom.difficulty || "Easy");
      setPlayerId(id);
      setScreen("lobby");
    });

    socket.on("race-started", ({ room: nextRoom, problem: nextProblem, timeLimitSeconds }) => {
      setRoom(nextRoom);
      setProblem(nextProblem);
      setProgress(nextRoom.progress || {});
      setTimeLeft(timeLimitSeconds);
      setHint("");
      setResult(null);
      setScreen("race");
    });

    socket.on("progress-update", ({ room: nextRoom }) => {
      setRoom(nextRoom);
      setProgress(nextRoom.progress || {});
    });

    socket.on("hint-response", ({ hint: nextHint, room: nextRoom }) => {
      setHint(nextHint);
      setRoom(nextRoom);
      setProgress(nextRoom.progress || {});
    });

    socket.on("race-ended", ({ result: nextResult, room: nextRoom }) => {
      setRoom(nextRoom);
      setResult(nextResult);
      setProgress(nextRoom.progress || {});
      setSubmitting(false);
      setScreen("result");
    });

    socket.on("action-error", ({ message }) => {
      setError(message);
      setSubmitting(false);
    });

    return () => {
      socket.off("room-created");
      socket.off("room-updated");
      socket.off("joined-room");
      socket.off("race-started");
      socket.off("progress-update");
      socket.off("hint-response");
      socket.off("race-ended");
      socket.off("action-error");
    };
  }, []);

  useEffect(() => {
    setCode(starterCode[language]);
  }, [language]);

  useEffect(() => {
    if (screen !== "race") return undefined;
    const timer = window.setInterval(() => {
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [screen]);

  const me = useMemo(() => room?.players?.find((player) => player.id === playerId), [room, playerId]);
  const opponent = useMemo(() => room?.players?.find((player) => player.id !== playerId), [room, playerId]);
  const myProgress = progress[playerId] || {};
  const opponentProgress = opponent ? progress[opponent.id] || {} : {};

  function clearError() {
    if (error) setError("");
  }

  function createRoom() {
    clearError();
    socket.emit("create-room", { name: name.trim() || "Player" });
  }

  function joinRoom() {
    clearError();
    socket.emit("join-room", {
      name: name.trim() || "Player",
      roomCode: roomInput.trim().toUpperCase()
    });
  }

  function startRace() {
    clearError();
    socket.emit("start-race", { roomCode: room.code });
  }

  function changeDifficulty(difficulty) {
    clearError();
    setSelectedDifficulty(difficulty);
    socket.emit("set-difficulty", { roomCode: room.code, difficulty });
  }

  function submitCode() {
    clearError();
    setSubmitting(true);
    socket.emit("submit-code", {
      roomCode: room.code,
      code,
      language
    });
  }

  function requestHint(type) {
    clearError();
    socket.emit("request-hint", {
      roomCode: room.code,
      hintType: type
    });
  }

  function copyRoomCode() {
    navigator.clipboard?.writeText(room?.code || "");
  }

  return (
    <main className="app-shell">
      <nav className="topbar">
        <div className="brand">
          <Code2 size={20} />
          Code<span>Race</span>
        </div>
        <div className="nav-meta">
          <span>Realtime DSA duel</span>
          <span>Socket.io</span>
          <span>Judge-ready</span>
        </div>
      </nav>

      {error ? <div className="toast">{error}</div> : null}

      {screen === "home" ? (
        <section className="home-grid">
          <div className="hero-copy">
            <p className="eyebrow">Multiplayer coding race</p>
            <h1>Race your friends. Code faster. Win smarter.</h1>
            <p>
              Create a private room, invite an opponent, solve the same DSA challenge, and watch live progress update without exposing code.
            </p>
            <div className="feature-strip">
              <span>WebSocket rooms</span>
              <span>AI hint penalties</span>
              <span>Live test progress</span>
              <span>Post-match review</span>
            </div>
          </div>
          <div className="auth-panel">
            <label>Your Name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Ada Lovelace" />
            <button className="primary" onClick={createRoom}>
              <Rocket size={17} />
              Create Room
            </button>
            <div className="splitter">or join existing room</div>
            <div className="join-row">
              <input value={roomInput} onChange={(event) => setRoomInput(event.target.value)} placeholder="RACE42" />
              <button onClick={joinRoom}>Join</button>
            </div>
          </div>
        </section>
      ) : null}

      {screen === "lobby" && room ? (
        <section className="lobby">
          <div>
            <p className="eyebrow">Room ready</p>
            <h1>{room.code}</h1>
            <p>Share this code with your opponent. The race starts when both players are inside.</p>
            <button className="copy" onClick={copyRoomCode}>
              <Clipboard size={16} />
              Copy room code
            </button>
          </div>
          <div className="players-panel">
            <div className="panel-title">
              <Users size={18} />
              Players
            </div>
            {room.players.map((player) => (
              <div className="player-row" key={player.id}>
                <span>{player.name}</span>
                <small>{player.id === playerId ? "You" : "Opponent"}</small>
              </div>
            ))}
            {room.players.length < 2 ? <div className="waiting">Waiting for one more player...</div> : null}
            <div className="difficulty-box">
              <div>
                <strong>Difficulty</strong>
                <small>{room.players[0]?.id === playerId ? "Host controls this match setting" : "Selected by host"}</small>
              </div>
              <div className="difficulty-options">
                {["Easy", "Medium", "Hard"].map((difficulty) => (
                  <button
                    className={selectedDifficulty === difficulty ? "active" : ""}
                    disabled={room.players[0]?.id !== playerId}
                    key={difficulty}
                    onClick={() => changeDifficulty(difficulty)}
                  >
                    {difficulty}
                  </button>
                ))}
              </div>
            </div>
            <button className="primary" disabled={room.players.length < 2} onClick={startRace}>
              <Play size={17} />
              Start Race
            </button>
          </div>
        </section>
      ) : null}

      {screen === "race" && room && problem ? (
        <section className="race-grid">
          <aside className="problem-panel">
            <div className="race-header">
              <span className={`pill ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
              <span className="timer">
                <Clock size={15} />
                {formatTime(timeLeft)}
              </span>
            </div>
            <h2>{problem.title}</h2>
            <p>{problem.statement}</p>
            <h3>Input</h3>
            <p>{problem.inputFormat}</p>
            <h3>Output</h3>
            <p>{problem.outputFormat}</p>
            <h3>Example</h3>
            <pre>{problem.examples[0]}</pre>
          </aside>

          <section className="editor-panel">
            <div className="editor-toolbar">
              <select value={language} onChange={(event) => setLanguage(event.target.value)}>
                {Object.entries(languageLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button className="primary compact" disabled={submitting} onClick={submitCode}>
                {submitting ? <Loader2 className="spin" size={16} /> : <Flag size={16} />}
                Submit
              </button>
            </div>
            <Editor
              height="64vh"
              language={language === "cpp" ? "cpp" : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "JetBrains Mono, Consolas, monospace"
              }}
            />
          </section>

          <aside className="status-panel">
            <ProgressCard name={me?.name || "You"} progress={myProgress} self />
            <ProgressCard name={opponent?.name || "Opponent"} progress={opponentProgress} />

            <div className="score-rules">
              <div className="panel-title">Score Rules</div>
              <span>Base score: 1000</span>
              <span>First solve: +100</span>
              <span>No hints: +150</span>
              <span>Wrong submit: -20</span>
            </div>

            <div className="hint-panel">
              <div className="panel-title">
                <Bot size={18} />
                AI Hints
              </div>
              {["basic", "approach", "edge-case", "optimization"].map((type) => (
                <button className="hint-button" key={type} onClick={() => requestHint(type)}>
                  <span>{formatHint(type)}</span>
                  <small>-{hintPenalty(type)}</small>
                </button>
              ))}
              {hint ? <div className="hint-output">{hint}</div> : null}
            </div>
          </aside>
        </section>
      ) : null}

      {screen === "result" && result ? (
        <section className="result-screen">
          <Trophy size={48} />
          <p className="eyebrow">Race complete</p>
          <h1>{result.winnerName} wins</h1>
          <div className="score-grid">
            {result.players.map((player) => (
              <div className="score-card" key={player.id}>
                <h2>{player.name}</h2>
                <strong>{player.score}</strong>
                <span>{player.passedTests}/{player.totalTests} tests passed</span>
                <small>{player.hintsUsed} hints used, {player.submissions} submissions</small>
                <small>Hint penalty: -{player.hintPenalty || 0}</small>
              </div>
            ))}
          </div>
          <div className="review-box">
            <h2>AI Post-Match Review</h2>
            <p>{result.review}</p>
          </div>
          <button className="primary compact" onClick={() => window.location.reload()}>
            New Race
          </button>
        </section>
      ) : null}
    </main>
  );
}

function ProgressCard({ name, progress, self }) {
  const total = progress.totalTests || 5;
  const passed = progress.passedTests || 0;
  const percent = Math.round((passed / total) * 100);

  return (
    <div className="progress-card">
      <div className="progress-top">
        <strong>{name}</strong>
        <span>{self ? "You" : "Rival"}</span>
      </div>
      <div className="bar">
        <div style={{ width: `${percent}%` }} />
      </div>
      <div className="progress-bottom">
        <span>{passed}/{total} tests</span>
        <span>{progress.status || "Waiting"}</span>
      </div>
      {passed === total ? (
        <div className="accepted">
          <CheckCircle2 size={15} />
          Accepted
        </div>
      ) : null}
    </div>
  );
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, "0");
  const rest = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${rest}`;
}

function formatHint(type) {
  return type
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function hintPenalty(type) {
  return {
    basic: 10,
    approach: 20,
    "edge-case": 15,
    optimization: 25
  }[type];
}

export default App;
