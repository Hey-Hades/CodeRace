import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/socketStore.js";
import { saveRaceResult } from "../services/resultService.js";
import { useUserStore } from "../store/useUserStore.js";

// --- Extracted Hooks ---
import { useResizablePanels } from "../hooks/race/useResizablePanels.js";
import { useRaceTimer } from "../hooks/race/useRaceTimer.js";
import { useSubmission } from "../hooks/race/useSubmission.js";

// --- Extracted Components ---
import ReadyOverlay from "./race/ReadyOverlay.jsx";
import RaceHUD from "./race/RaceHUD.jsx";
import SplitHandle from "./race/SplitHandle.jsx";
import ProblemPanel from "./race/ProblemPanel.jsx";
import EditorPanel from "./race/EditorPanel.jsx";
import ConsolePanel from "./race/ConsolePanel.jsx";

const Race = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  const [ping, setPing] = useState(0);

  // --- Routing & Match State ---
  const difficulty = (location.state?.difficulty || "medium").toLowerCase();
  const initialCompany = location.state?.company || "All";
  const isPractice = location.state?.isPractice || false;
  const matchType = location.state?.matchType || "Rapid (30 min)";
  const { user, profile } = useUserStore();
  const typingStats = useRef({ total: 0, bakspaces: 0 });

  const storedRoom = isPractice
    ? null
    : sessionStorage.getItem("coderace_active_room");
  const [roomId, setRoomId] = useState(
    location.state?.roomId || storedRoom || "ERROR",
  );

  // --- PLAYER NAMES STATE ---
  const myName =
    profile?.username || location.state?.playerName || user?.email || "Player";
  const [opponentName, setOpponentName] = useState(
    location.state?.opponentName || "Waiting...",
  );

  // --- Timer Fallback Logic ---
  const getTimeLimit = (type) => {
    if (!type) return 30;
    if (type.includes("Zen")) return -1;
    if (type.startsWith("Bullet")) return 5;
    if (type.startsWith("Blitz")) return 15;
    if (type.startsWith("Rapid")) return 30;
    if (type.startsWith("Custom")) {
      const match = type.match(/\((\d+)\s*min\)/);
      return match ? Number(match[1]) : 30;
    }
    return 30;
  };
  const timeLimitMinutes = location.state?.timeLimit || getTimeLimit(matchType);

  const [problem, setProblem] = useState(null);
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [hints, setHints] = useState([]);
  const [snippetsCache, setSnippetsCache] = useState({});

  const [hasClickedReady, setHasClickedReady] = useState(false);
  const hasRequestedPractice = useRef(false); // 👉 NEW: Silent tracker prevents React unmount loop
  const [raceStarted, setRaceStarted] = useState(false);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [matchConclusion, setMatchConclusion] = useState(null);

  // --- Editor State ---
  const [language, setLanguage] = useState("cpp");
  const [code, setCode] = useState("// Waiting for problem...");

  // ==========================================
  // 1. CUSTOM HOOKS
  // ==========================================
  const { leftWidth, bottomHeight, isDragging, setIsDragging } =
    useResizablePanels();

  const { countdown, setCountdown, timeLeft, formatTime, syncCountdown } =
    useRaceTimer(timeLimitMinutes, raceStarted);

  const {
    isSubmitting,
    setIsSubmitting,
    terminalLogs,
    setTerminalLogs,
    myProgress,
    totalCases,
    handleSubmitCode,
    handleRunCode,
  } = useSubmission(socket, roomId, problem, isPractice, raceStarted, timeLeft);

  const onSubmit = () => handleSubmitCode(language, code);
  const onRun = () => handleRunCode(language, code);

  useEffect(() => {
    if (timeLeft === 0 && raceStarted) {
      setTerminalLogs((prev) => [...prev, `🚨 TIME UP! Match concluded.`]);
      setIsSubmitting(true);
    }
  }, [timeLeft, raceStarted, setTerminalLogs, setIsSubmitting]);

  // ==========================================
  // 2. MONACO THEME INJECTION
  // ==========================================
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme("codeRaceTheme", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "ff6b2b", fontStyle: "bold" },
        { token: "type", foreground: "2cbb5d" },
        { token: "string", foreground: "e5c07b" },
        { token: "comment", foreground: "5c6370", fontStyle: "italic" },
      ],
      colors: {
        "editor.background": "#0a0a0a",
        "editor.lineHighlightBackground": "#161616",
        "editorLineNumber.foreground": "#444444",
        "editorIndentGuide.background": "#1e1e1e",
      },
    });
  };

  const handleEditorDidMount = (editor, monaco) => {
    editor.onKeyDown((e) => {
      if (
        e.KeyCode === monaco.KeyCode.Backspace &&
        e.KeyCode === monaco.KeyCode.Delete
      ) {
        typingStats.current.bakspaces += 1;
      } else {
        typingStats.current.total += 1;
      }
    });
  };

  // ==========================================
  // 3. SOCKET LISTENERS (PRACTICE CREATION)
  // ==========================================
  useEffect(() => {
    if (!isPractice || !socket) return;

    const handlePracticeRoomCreated = ({ roomId: newRoomId }) => {
      setRoomId(newRoomId);
      sessionStorage.setItem("coderace_active_room", newRoomId);

      // 500ms delay ensures React is ready to listen
      setTimeout(() => {
        console.log(
          "FRONTEND: Emitting toggle_ready for practice room",
          newRoomId,
        );
        socket.emit("toggle_ready", { roomId: newRoomId, isReady: true });
      }, 500);
    };

    socket.on("room_created", handlePracticeRoomCreated);

    // Only ask the server to create a room ONCE, silently, without re-rendering
    if (!hasRequestedPractice.current) {
      hasRequestedPractice.current = true;
      console.log("🚀 Creating practice room...");
      socket.emit("create_room", {
        difficulty,
        company: initialCompany,
        matchType: "practice",
        playerName: myName,
        userId: user?.id,
      });
    }

    return () => socket.off("room_created", handlePracticeRoomCreated);
  }, [isPractice, socket, difficulty, initialCompany, myName]);

  // ==========================================
  // 4. GENERAL MATCH LISTENERS
  // ==========================================
  useEffect(() => {
    if (!socket) return;
    if (roomId === "ERROR" && !isPractice) {
      navigate("/");
      return;
    }

    const activeRoomId = sessionStorage.getItem("coderace_active_room");

    // Never attempt to "rejoin" a room if we are in Practice Mode
    if (
      !isPractice &&
      activeRoomId &&
      activeRoomId === roomId &&
      !hasClickedReady
    ) {
      socket.emit("rejoin_room", { roomId });
      setHasClickedReady(true);
    } else if (roomId !== "ERROR") {
      sessionStorage.setItem("coderace_active_room", roomId);
    }

    socket.on("player_joined", ({ joinerName }) => setOpponentName(joinerName));
    socket.on("room_joined", (data) => setOpponentName(data.creatorName));

    socket.on("problem_data", (data) => {
      setProblem(data);

      setExamples(
        data.examples
          ? typeof data.examples === "string"
            ? JSON.parse(data.examples)
            : data.examples
          : [],
      );
      setConstraints(
        data.constraints
          ? typeof data.constraints === "string"
            ? JSON.parse(data.constraints)
            : data.constraints
          : [],
      );
      setHints(
        data.hints
          ? typeof data.hints === "string"
            ? JSON.parse(data.hints)
            : data.hints
          : [],
      );

      let parsedCompanies = [];
      if (data.companies)
        parsedCompanies =
          typeof data.companies === "string"
            ? JSON.parse(data.companies)
            : data.companies;
      if (parsedCompanies.length === 0 && initialCompany !== "All")
        parsedCompanies = [initialCompany];
      setCompaniesList(parsedCompanies);

      if (data.code_snippets) {
        const snippets =
          typeof data.code_snippets === "string"
            ? JSON.parse(data.code_snippets)
            : data.code_snippets;
        setSnippetsCache(snippets);
        const initialLang = snippets["cpp"]
          ? "cpp"
          : snippets["java"]
            ? "java"
            : "python";
        setLanguage(initialLang);

        const savedCode = localStorage.getItem(
          `coderace_${roomId}_${initialLang}`,
        );
        setCode(
          savedCode || snippets[initialLang] || "// Write your code here",
        );
      }

      if (isPractice) setRaceStarted(true);
    });

    socket.on("start_countdown", ({ startTime }) => {
      syncCountdown(startTime, setRaceStarted);
    });

    socket.on("opponent_progress", ({ progress }) =>
      setOpponentProgress(progress),
    );

    socket.on("match_over", async ({ winnerId }) => {
      const didIWin = winnerId === socket.id;
      const timeTakenSecs = timeLimitMinutes * 60 - timeLeft;
      const timeTakenMins = Math.floor(timeTakenSecs / 60) || 1;

      const totalKeypresses = typingStats.current.total;
      const errors = typingStats.current.bakspaces;

      const grossWPM = totalKeypresses / 5 / timeTakenMins;
      let netWPM = grossWPM - errors / timeTakenMins;
      netWPM = Math.max(Math.round(netWPM), 0);

      let finalAccuracy = 0;
      if (grossWPM > 0) {
        finalAccuracy = Math.max(0, Math.round((netWPM / grossWPM) * 100));
      }

      try {
        const raceData = {
          wpm: netWPM, // Calculate this from your progress/timer
          accuracy: finalAccuracy, // Or whatever logic you have
          timeTaken: timeTakenSecs,
          problemTitle: problem?.title,
          didIWin: didIWin,
        };

        await saveRaceResult(user, raceData);
        console.log("Result saved successfully!");
      } catch (err) {
        console.error("Failed to persist result:", err);
      }

      setMatchConclusion(didIWin ? "Victory!" : "Defeat!");
      setTerminalLogs((prev) => [
        ...prev,
        didIWin
          ? `🏆 You won the match!`
          : `💀 Opponent finished first. Match over!`,
      ]);

      setTimeout(() => {
        sessionStorage.removeItem("coderace_active_room");
        navigate("/result", {
          state: {
            didIWin,
            myProgress,
            opponentProgress,
            myName,
            opponentName,
            myCode: code,
            problemTitle: problem?.title,
          },
        });
      }, 3000);
    });

    socket.on("opponent_left_handshake", () => {
      if (raceStarted && !isPractice) {
        setMatchConclusion("Opponent Fled!");
        setTerminalLogs((prev) => [
          ...prev,
          `🏆 Opponent fled the match! You win by default.`,
        ]);

        setTimeout(() => {
          sessionStorage.removeItem("coderace_active_room");
          navigate("/result", {
            state: {
              didIWin: true,
              myProgress,
              opponentProgress: "Fled",
              myName,
              opponentName,
              myCode: code,
              problemTitle: problem?.title,
            },
          });
        }, 3000);
      }
    });

    socket.on("room_error", (data) => {
      setTerminalLogs([`🚨 Server Error: ${data.message}`]);
    });

    return () => {
      socket.off("player_joined");
      socket.off("room_joined");
      socket.off("problem_data");
      socket.off("start_countdown");
      socket.off("opponent_progress");
      socket.off("match_over");
      socket.off("opponent_left_handshake");
      socket.off("room_error");
    };
  }, [socket, roomId, isPractice, navigate, initialCompany, timeLimitMinutes]);

  // ==========================================
  // 5. EDITOR ACTIONS
  // ==========================================
  const handleLanguageSelect = (newLang) => {
    setLanguage(newLang);
    const savedCode = localStorage.getItem(`coderace_${roomId}_${newLang}`);
    setCode(savedCode || snippetsCache[newLang] || "// Write your code here");
  };

  const handleCodeChange = (val) => {
    setCode(val);
    localStorage.setItem(`coderace_${roomId}_${language}`, val);
  };

  const handleResetCode = () => {
    if (
      window.confirm("Reset code to original state? All changes will be lost.")
    ) {
      const originalCode = snippetsCache[language] || "// Write your code here";
      setCode(originalCode);
      localStorage.setItem(`coderace_${roomId}_${language}`, originalCode);
    }
  };

  const handleLeaveMatch = () => {
    if (socket) socket.emit("leave_room", { roomId });
    sessionStorage.removeItem("coderace_active_room");
    navigate("/");
  };

  // ==========================================
  // 6. THEME & COLORS
  // ==========================================
  const colors = {
    bgApp: "#000000",
    bgPanel: "#0a0a0a",
    bgHeader: "#121212",
    border: "#1e1e1e",
    borderHover: "#ff6b2b",
    textMain: "#eff1f6",
    textMuted: "#6b7280",
    accent: "#ff6b2b",
    success: "#2cbb5d",
    warning: "#ffc107",
    fail: "#ef4743",
  };

  const availableLanguages = [
    { id: "cpp", label: "C++" },
    { id: "java", label: "Java" },
    { id: "python", label: "Python" },
  ];
  // ==========================================
  // PING SYSTEM LISTENER
  // ==========================================
  useEffect(() => {
    if (!socket) return;

    // Send a ping every 2 seconds
    const pingInterval = setInterval(() => {
      socket.emit("get_ping", Date.now());
    }, 2000);

    // Calculate latency when the server responds
    const handlePong = (timestamp) => {
      setPing(Date.now() - timestamp);
    };

    socket.on("pong_returned", handlePong);

    return () => {
      clearInterval(pingInterval);
      socket.off("pong_returned", handlePong);
    };
  }, [socket]);

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100vw",
        background: colors.bgApp,
        color: colors.textMain,
        fontFamily: "'JetBrains Mono', 'Segoe UI', sans-serif",
        overflow: "hidden",
      }}
    >
      {isDragging && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            cursor: isDragging === "vertical" ? "col-resize" : "row-resize",
          }}
        />
      )}

      {/* 3-Second Match Conclusion Overlay */}
      {matchConclusion && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              background: "#0a0a0a",
              border: `1px solid ${colors.border}`,
              padding: "40px 60px",
              borderRadius: "16px",
              textAlign: "center",
              boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ fontSize: "64px", marginBottom: "16px" }}>
              {matchConclusion === "Victory!"
                ? "🏆"
                : matchConclusion === "Defeat!"
                  ? "💀"
                  : "🏃💨"}
            </div>
            <div
              style={{
                fontSize: "32px",
                fontWeight: "bold",
                color: "#fff",
                marginBottom: "12px",
              }}
            >
              {matchConclusion}
            </div>
            <div
              style={{
                color: colors.accent,
                fontSize: "14px",
                fontWeight: "600",
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              Navigating to results...
            </div>
          </div>
        </div>
      )}

      <ReadyOverlay
        raceStarted={raceStarted}
        isPractice={isPractice}
        countdown={countdown}
        hasClickedReady={hasClickedReady}
        setHasClickedReady={setHasClickedReady}
        socket={socket}
        roomId={roomId}
        colors={colors}
      />

      <RaceHUD
        isPractice={isPractice}
        raceStarted={raceStarted}
        myProgress={myProgress}
        opponentProgress={opponentProgress}
        totalCases={totalCases}
        timeLeft={timeLeft}
        formatTime={formatTime}
        isSubmitting={isSubmitting}
        handleSubmitCode={onSubmit}
        handleRunCode={onRun}
        onLeaveMatch={handleLeaveMatch}
        colors={colors}
        ping={ping}
      />

      <div
        id="workspace-container"
        style={{
          boxSizing: "border-box",
          display: "flex",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          padding: "6px",
          gap: "6px",
        }}
      >
        <ProblemPanel
          leftWidth={leftWidth}
          problem={problem}
          difficulty={difficulty}
          companiesList={companiesList}
          examples={examples}
          constraints={constraints}
          hints={hints}
          colors={colors}
        />

        <SplitHandle
          direction="vertical"
          onMouseDown={() => setIsDragging("vertical")}
          colors={colors}
        />

        <div
          style={{
            boxSizing: "border-box",
            width: `calc(${100 - leftWidth}% - 10px)`,
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            overflow: "hidden",
          }}
        >
          <EditorPanel
            bottomHeight={bottomHeight}
            raceStarted={raceStarted}
            timeLeft={timeLeft}
            language={language}
            availableLanguages={availableLanguages}
            handleLanguageSelect={handleLanguageSelect}
            handleResetCode={handleResetCode}
            code={code}
            handleCodeChange={handleCodeChange}
            handleEditorWillMount={handleEditorWillMount}
            handleEditorDidMount={handleEditorDidMount}
            colors={colors}
          />

          <SplitHandle
            direction="horizontal"
            onMouseDown={() => setIsDragging("horizontal")}
            colors={colors}
          />

          <ConsolePanel
            bottomHeight={bottomHeight}
            examples={examples}
            terminalLogs={terminalLogs}
            colors={colors}
          />
        </div>
      </div>
    </div>
  );
};

export default Race;
