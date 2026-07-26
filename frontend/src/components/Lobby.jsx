import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSocket } from "../context/socketStore.js";
import LobbyForm from "./lobby/LobbyForm.jsx";
import WaitingRoom from "./lobby/WaitingRoom.jsx";
import { useUserStore } from "../store/useUserStore.js";

const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const isPracticeMode = location.pathname.includes("practice");

  const [multiplayerMode, setMultiplayerMode] = useState("create");
  const [playerName, setPlayerName] = useState("");
  const [difficulty, setDifficulty] = useState("med");
  const [company, setCompany] = useState("All");
  const [matchType, setMatchType] = useState("Blitz (15 min)");
  const [customTime, setCustomTime] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");

  const [isWaiting, setIsWaiting] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [opponentName, setOpponentName] = useState(null);
  const [amIReady, setAmIReady] = useState(false);
  const [isOpponentReady, setIsOpponentReady] = useState(false);

  const [copied, setCopied] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [isRequestingRoom, setIsRequestingRoom] = useState(false);
  const [lobbyError, setLobbyError] = useState("");

  const { user, profile } = useUserStore();

  // --- SOLVE CLOSURE BUG FOR SOCKET LISTENERS ---
  const playerNameRef = useRef(``);
  const opponentNameRef = useRef("Opponent");

  useEffect(() => {
    if (profile?.username) {
      setPlayerName(profile.username);
      playerNameRef.current = profile.username;
    }
  }, [profile?.username]);

  // Handle manual typing for guests
  const handleNameChange = (newName) => {
    if (!profile?.username) {
      setPlayerName(newName);
      playerNameRef.current = newName;
    }
  };

  useEffect(() => {
    if (opponentName) opponentNameRef.current = opponentName;
  }, [opponentName]);

  // --- TIMER EXTRACTION LOGIC ---
  const extractTimeLimit = (type) => {
    if (type.includes("Zen")) return -1; // -1 represents Infinity
    const match = type.match(/\((\d+)\s*min\)/);
    return match ? Number(match[1]) : 30; // Fallback to 30
  };

  useEffect(() => {
    if (!socket || isPracticeMode) return undefined;

    const handleRoomCreated = ({ roomId }) => {
      setRoomId(roomId);
      setIsWaiting(true);
      setIsRequestingRoom(false);
      setLobbyError("");
    };

    const handleRoomJoined = ({
      roomId,
      creatorName,
      difficulty,
      company,
      matchType,
    }) => {
      setRoomId(roomId);
      setOpponentName(creatorName);
      setDifficulty(difficulty);
      setCompany(company);
      setMatchType(matchType);
      setIsWaiting(true);
      setIsRequestingRoom(false);
      setLobbyError("");
    };

    const handlePlayerJoined = ({ joinerName }) => {
      setOpponentName(joinerName);
      setIsOpponentReady(false);
      setLobbyError("");
    };

    const handleReadyStatus = ({ playerId, isReady }) => {
      if (playerId === socket.id) setAmIReady(isReady);
      else setIsOpponentReady(isReady);
    };

    const handleMatchStarted = ({ roomId, difficulty, company, matchType }) => {
      const timeLimit = extractTimeLimit(matchType);

      // 👉 UPDATED: Now safely passes BOTH live names using Refs
      navigate("/race", {
        state: {
          roomId,
          difficulty,
          company,
          matchType,
          timeLimit,
          isPractice: false,
          playerName: playerNameRef.current.trim(),
          opponentName: opponentNameRef.current,
        },
      });
    };

    const handleRoomError = ({ message }) => {
      setLobbyError(message || "Something went wrong. Please try again.");
      setIsRequestingRoom(false);
    };

    const handleOpponentLeft = () => {
      setOpponentName(null);
      setAmIReady(false);
      setIsOpponentReady(false);
      setLobbyError("Opponent left the arena. Waiting for a new player.");
    };

    socket.on("room_created", handleRoomCreated);
    socket.on("room_joined", handleRoomJoined);
    socket.on("player_joined", handlePlayerJoined);
    socket.on("player_ready_status", handleReadyStatus);
    socket.on("match_started", handleMatchStarted);
    socket.on("room_error", handleRoomError);
    socket.on("opponent_left_handshake", handleOpponentLeft);

    return () => {
      socket.off("room_created", handleRoomCreated);
      socket.off("room_joined", handleRoomJoined);
      socket.off("player_joined", handlePlayerJoined);
      socket.off("player_ready_status", handleReadyStatus);
      socket.off("match_started", handleMatchStarted);
      socket.off("room_error", handleRoomError);
      socket.off("opponent_left_handshake", handleOpponentLeft);
    };
  }, [socket, navigate, isPracticeMode]);

  const getFinalMatchType = () => {
    const minutes = Math.min(Math.max(Number(customTime || 10), 1), 180);
    return matchType === "Custom" ? `Custom (${minutes} min)` : matchType;
  };

  const resetLobby = () => {
    setIsWaiting(false);
    setRoomId(null);
    setOpponentName(null);
    setAmIReady(false);
    setIsOpponentReady(false);
    setIsRequestingRoom(false);
    setLobbyError("");
  };

  const handleCopy = async () => {
    if (!roomId) return;
    try {
      await navigator.clipboard.writeText(roomId);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requireName = () => {
    if (playerName.trim()) return true;
    setLobbyError("Please enter your name first.");
    return false;
  };

  const handleStartPractice = () => {
    if (!requireName()) return;
    setLobbyError("");
    const finalMatchType = getFinalMatchType();
    const timeLimit = extractTimeLimit(finalMatchType);

    navigate("/race", {
      state: {
        difficulty,
        company,
        matchType: finalMatchType,
        timeLimit,
        isPractice: true,
        playerName: playerName.trim(),
      },
    });
  };

  const handleCreateRoom = () => {
    if (!socket) {
      setLobbyError("Still connecting to server...");
      return;
    }
    if (!requireName()) return;
    setLobbyError("");
    setIsRequestingRoom(true);
    socket.emit("create_room", {
      difficulty,
      company,
      matchType: getFinalMatchType(),
      playerName: playerName.trim(),
      userId: user?.id,
    });
  };

  const handleJoinRoom = () => {
    if (!socket) {
      setLobbyError("Still connecting to server...");
      return;
    }
    if (!requireName()) return;
    if (!roomCodeInput.trim()) {
      setLobbyError("Please enter a room code.");
      return;
    }
    setLobbyError("");
    setIsRequestingRoom(true);
    socket.emit("join_room", {
      roomId: roomCodeInput.trim().toUpperCase(),
      playerName: playerName.trim(),
      userId: user?.id,
    });
  };

  const handleSubmit = () => {
    if (isPracticeMode) handleStartPractice();
    else if (multiplayerMode === "create") handleCreateRoom();
    else handleJoinRoom();
  };

  const toggleReady = () => {
    if (!socket || !roomId || !opponentName) return;
    socket.emit("toggle_ready", { roomId, isReady: !amIReady });
  };

  const handleCancel = () => {
    socket?.emit("leave_room", { roomId });
    resetLobby();
    navigate("/");
  };

  const primaryText = () => {
    if (isRequestingRoom) return "Connecting...";
    if (isPracticeMode) return "Start practice session ->";
    return multiplayerMode === "create"
      ? "Create race room ->"
      : "Join race room ->";
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        minHeight: "calc(100vh - 70px)",
        padding: "2rem",
      }}
    >
      <div style={{ width: "400px" }}>
        {!isWaiting ? (
          <LobbyForm
            isPracticeMode={isPracticeMode}
            multiplayerMode={multiplayerMode}
            playerName={playerName}
            difficulty={difficulty}
            company={company}
            matchType={matchType}
            customTime={customTime}
            roomCodeInput={roomCodeInput}
            focusedInput={focusedInput}
            lobbyError={lobbyError}
            isRequestingRoom={isRequestingRoom}
            primaryText={primaryText()}
            onModeChange={(mode) => {
              setMultiplayerMode(mode);
              setLobbyError("");
            }}
            isNameLocked={!!profile?.username}
            onPlayerNameChange={handleNameChange}
            onDifficultyChange={setDifficulty}
            onCompanyChange={setCompany}
            onMatchTypeChange={setMatchType}
            onCustomTimeChange={setCustomTime}
            onRoomCodeChange={setRoomCodeInput}
            onFocusChange={setFocusedInput}
            onSubmit={handleSubmit}
          />
        ) : (
          <WaitingRoom
            roomId={roomId}
            playerName={playerName}
            opponentName={opponentName}
            amIReady={amIReady}
            isOpponentReady={isOpponentReady}
            matchLabel={getFinalMatchType()}
            difficulty={difficulty}
            copied={copied}
            lobbyError={lobbyError}
            onCopy={handleCopy}
            onToggleReady={toggleReady}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
};
export default Lobby;
