import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        // Fetch the top 50 players from your new backend route!
        const backendUrl = import.meta.env.VITE_BACKEND_URL;
        const response = await fetch(`${backendUrl}/api/users/leaderboard`);
        if (!response.ok) throw new Error("Failed to fetch leaderboard");

        const data = await response.json();
        setPlayers(data);
      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "calc(100vh - 80px)",
        padding: "3rem 1rem",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: "800",
            color: "#fff",
            marginBottom: "8px",
          }}
        >
          Global <span style={{ color: "#ff6b2b" }}>Rankings</span>
        </h1>
        <p style={{ fontSize: "14px", color: "#888" }}>
          The top competitive programmers in the arena.
        </p>
      </div>

      {/* Leaderboard Table Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "800px",
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Table Headers */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "80px 2fr 1fr 1fr 1fr",
            padding: "16px 24px",
            background: "#0f0f0f",
            borderBottom: "1px solid #1e1e1e",
            fontSize: "11px",
            color: "#555",
            textTransform: "uppercase",
            letterSpacing: "1px",
            fontWeight: "600",
          }}
        >
          <div>Rank</div>
          <div>CodeName</div>
          <div style={{ textAlign: "center" }}>Rating</div>
          <div style={{ textAlign: "center" }}>Win Rate</div>
          <div style={{ textAlign: "right" }}>Matches</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
              animation: "pulse 1.5s infinite opacity",
            }}
          >
            Fetching live rankings...
          </div>
        )}

        {/* Players List */}
        {!isLoading && players.length === 0 && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#666",
              fontSize: "14px",
            }}
          >
            No players ranked yet. Be the first!
          </div>
        )}

        {/* Render Players */}
        {!isLoading &&
          players.map((player, index) => {
            // Calculate win rate (avoid division by zero)
            const winRate =
              player.matches_played > 0
                ? Math.round((player.wins / player.matches_played) * 100)
                : 0;

            // Special styling for Top 3
            const isFirst = index === 0;
            const isSecond = index === 1;
            const isThird = index === 2;

            return (
              <div
                key={player.username}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 2fr 1fr 1fr 1fr",
                  padding: "20px 24px",
                  borderBottom: "1px solid #111",
                  alignItems: "center",
                  transition: "background 0.2s",
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "#111")}
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {/* Rank */}
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "800",
                    color: isFirst
                      ? "#ffd700"
                      : isSecond
                        ? "#c0c0c0"
                        : isThird
                          ? "#cd7f32"
                          : "#444",
                  }}
                >
                  #{index + 1}
                </div>

                {/* Username */}
                <div
                  style={{
                    fontSize: "15px",
                    fontWeight: "600",
                    color: "#e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {player.username}
                  {isFirst && <span style={{ fontSize: "14px" }}>👑</span>}
                </div>

                {/* ELO Rating */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#ff6b2b",
                  }}
                >
                  {player.rating}
                </div>

                {/* Win Rate */}
                <div
                  style={{
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#888",
                  }}
                >
                  {winRate}%
                </div>

                {/* Total Matches */}
                <div
                  style={{
                    textAlign: "right",
                    fontSize: "14px",
                    color: "#666",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {player.matches_played}
                </div>
              </div>
            );
          })}
      </div>

      {/* Back to Home Button */}
      <div style={{ marginTop: "2rem" }}>
        <button className="btn-ghost" onClick={() => navigate("/")}>
          ← Back to Arena
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;

