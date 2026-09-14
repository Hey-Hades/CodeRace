import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
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
    <div className="flex flex-col items-center min-h-[calc(100vh-60px)] px-4 py-8 sm:py-12">

      {/* Header */}
      <div className="text-center mb-8 sm:mb-10">
        <h1 className="text-2xl sm:text-[32px] font-extrabold text-white mb-2">
          Global <span className="text-[#ff6b2b]">Rankings</span>
        </h1>
        <p className="text-sm text-[#888]">The top competitive programmers in the arena.</p>
      </div>

      {/* Table Container */}
      <div className="w-full max-w-[800px] bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden">

        {/* Table Header — columns hidden progressively on small screens */}
        <div className="grid grid-cols-[56px_1fr_80px] sm:grid-cols-[72px_1fr_90px_90px] lg:grid-cols-[80px_2fr_1fr_1fr_1fr] px-4 sm:px-6 py-4 bg-[#0f0f0f] border-b border-[#1e1e1e] text-[11px] text-[#555] uppercase tracking-[1px] font-semibold">
          <div>Rank</div>
          <div>CodeName</div>
          <div className="text-center">Rating</div>
          <div className="hidden sm:block text-center">Win Rate</div>
          <div className="hidden lg:block text-right">Matches</div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="px-6 py-10 text-center text-[#666] text-sm animate-pulse">
            Fetching live rankings...
          </div>
        )}

        {/* Empty */}
        {!isLoading && players.length === 0 && (
          <div className="px-6 py-10 text-center text-[#666] text-sm">
            No players ranked yet. Be the first!
          </div>
        )}

        {/* Player rows */}
        {!isLoading &&
          players.map((player, index) => {
            const winRate =
              player.matches_played > 0
                ? Math.round((player.wins / player.matches_played) * 100)
                : 0;
            const isFirst  = index === 0;
            const isSecond = index === 1;
            const isThird  = index === 2;

            const rankColor = isFirst
              ? "#ffd700"
              : isSecond
                ? "#c0c0c0"
                : isThird
                  ? "#cd7f32"
                  : "#444";

            return (
              <div
                key={player.username}
                className="grid grid-cols-[56px_1fr_80px] sm:grid-cols-[72px_1fr_90px_90px] lg:grid-cols-[80px_2fr_1fr_1fr_1fr] px-4 sm:px-6 py-4 border-b border-[#111] items-center transition-colors hover:bg-[#111] cursor-pointer"
              >
                {/* Rank */}
                <div className="text-base sm:text-lg font-extrabold" style={{ color: rankColor }}>
                  #{index + 1}
                </div>

                {/* Username */}
                <div className="text-sm sm:text-[15px] font-semibold text-[#e8e8e8] flex items-center gap-2 truncate">
                  <span className="truncate">{player.username}</span>
                  {isFirst && <span className="text-sm shrink-0">👑</span>}
                </div>

                {/* ELO */}
                <div className="text-center text-sm sm:text-[15px] font-bold text-[#ff6b2b]">
                  {player.rating}
                </div>

                {/* Win Rate — hidden on mobile */}
                <div className="hidden sm:block text-center text-sm text-[#888]">
                  {winRate}%
                </div>

                {/* Matches — hidden on < lg */}
                <div className="hidden lg:block text-right text-sm text-[#666] tabular-nums">
                  {player.matches_played}
                </div>
              </div>
            );
          })}
      </div>

      <div className="mt-8">
        <button className="btn-ghost text-sm" onClick={() => navigate("/")}>
          ← Back to Arena
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;
