import React from "react";

const ReadyOverlay = ({
  raceStarted,
  isPractice,
  countdown,
  hasClickedReady,
  setHasClickedReady,
  socket,
  roomId,
  colors,
}) => {
  if (raceStarted || isPractice) return null;

  const isGo = countdown <= 0;
  const activeColor = isGo ? colors.success : colors.accent;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-[10px] z-[1000] flex justify-center items-center">
      {countdown !== null ? (
        <div
          style={{
            "--glow-color": activeColor,
            textShadow: `0 0 60px var(--glow-color)`,
          }}
          className={`
            font-black transition-all duration-300 drop-shadow-2xl
            ${isGo ? "text-[140px]" : "text-[180px]"}
          `}
          // We can apply color dynamically via standard inline styles to avoid color parsing lag
          style={{
            color: activeColor,
            textShadow: `0 0 60px ${activeColor}66`,
          }}
        >
          {countdown > 0 ? (countdown > 3 ? 3 : countdown) : "GO!"}
        </div>
      ) : (
        <div
          style={{
            "--panel-bg": colors.bgPanel,
            "--panel-border": colors.border,
            "--accent-color": colors.accent,
            "--text-muted": colors.textMuted,
          }}
          className="box-border text-center w-[380px] bg-[var(--panel-bg)] border border-[var(--panel-border)] p-10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)]"
        >
          <h3 className="text-2xl font-extrabold mb-2 text-white">
            Arena Ready
          </h3>
          <p className="text-[13px] text-[var(--text-muted)] mb-[30px] uppercase tracking-wider">
            Waiting for both players...
          </p>

          {!hasClickedReady ? (
            <button
              onClick={() => {
                setHasClickedReady(true);
                socket?.emit("toggle_ready", { roomId, isReady: true });
              }}
              className="w-full p-4 bg-[var(--accent-color)] text-white border-none rounded-lg cursor-pointer font-bold text-base hover:brightness-110 active:scale-[0.98] transition-all"
            >
              Ready Up ⚡
            </button>
          ) : (
            <div className="p-4 text-[var(--accent-color)] font-semibold animate-pulse border border-[var(--accent-color)]/25 rounded-lg bg-[var(--accent-color)]/10">
              Waiting for opponent...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadyOverlay;

