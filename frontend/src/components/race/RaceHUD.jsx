import React from "react";

const RaceHUD = ({
  isPractice,
  raceStarted,
  myProgress,
  opponentProgress,
  totalCases,
  timeLeft,
  formatTime,
  isSubmitting,
  handleSubmitCode,
  handleRunCode,
  onLeaveMatch,
  colors,
  ping,
}) => {
  const isDisabled = !raceStarted || isSubmitting || timeLeft === 0;
  const isTimeCritical = timeLeft <= 60 && timeLeft > 0;
  const timerColor =
    timeLeft <= 60 && timeLeft !== -1 ? colors.fail : colors.textMain;
  const getPingColor = () => {
    if (ping < 80) return colors.success; // Green for good connection
    if (ping < 150) return colors.warning; // Yellow for okay connection
    return colors.fail; // Red for bad connection
  };

  return (
    <div
      style={{
        "--hud-border": colors.border,
        "--hud-bg": colors.bgApp,
        "--hud-accent": colors.accent,
        "--hud-success": colors.success,
        "--hud-muted": colors.textMuted,
      }}
      className="box-border h-[54px] border-b border-[var(--hud-border)] flex items-center justify-between px-6 bg-[var(--hud-bg)] shrink-0 z-50 font-mono"
    >
      {/* 1. PROGRESS BARS (LEFT) */}
      <div className="flex-1 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--hud-muted)] font-semibold">
            You
          </span>
          <div className="w-[100px] h-1 bg-[#222] rounded-full overflow-hidden">
            <div
              style={{ width: `${(myProgress / totalCases) * 100}%` }}
              className="h-full bg-[var(--hud-accent)] transition-[width] duration-300 ease-out"
            />
          </div>
          <span className="text-xs text-[var(--hud-accent)] font-bold">
            {myProgress}
          </span>
        </div>

        {!isPractice && (
          <>
            <span className="text-xs text-[#444] font-black select-none">
              VS
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--hud-success)] font-bold">
                {opponentProgress}
              </span>
              <div className="w-[100px] h-1 bg-[#222] rounded-full overflow-hidden">
                <div
                  style={{ width: `${(opponentProgress / totalCases) * 100}%` }}
                  className="h-full bg-[var(--hud-success)] transition-[width] duration-300 ease-out"
                />
              </div>
              <span className="text-xs text-[var(--hud-muted)] font-semibold">
                Opponent
              </span>
            </div>
          </>
        )}
      </div>

      {/* 2. ENGINE ACTIONS (CENTER) */}
      <div className="flex-1 flex justify-center items-center gap-3">
        {isSubmitting && (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--hud-accent)] animate-pulse" />
        )}

        {/* RUN CODE BUTTON */}
        <button
          onClick={handleRunCode}
          disabled={isDisabled}
          className={`
            px-3.5 py-1.25 text-xs bg-[#1a1a1a] text-[#e8e8e8] border border-[#333] rounded-md font-semibold flex items-center gap-1.5 transition-all
            ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#2a2a2a] hover:border-[#555]"}
          `}
        >
          <span className="text-[10px] text-[#888]">▶</span> Run
        </button>

        {/* SUBMIT CODE BUTTON */}
        <button
          onClick={handleSubmitCode}
          disabled={isDisabled}
          className={`
            px-4 py-1.25 text-xs bg-emerald-500/10 text-[var(--hud-success)] border border-emerald-500/30 rounded-md font-semibold flex items-center gap-1.5 transition-all
            ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/60"}
          `}
        >
          Submit
        </button>
      </div>

      {/* 3. CLOCK & LEAVE ACTION (RIGHT) */}

      <div className="flex-1 flex justify-end items-center gap-6">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "12px", color: colors.textMuted }}>
            Ping:{" "}
            <span style={{ color: getPingColor(), fontWeight: "bold" }}>
              {ping}ms
            </span>
          </span>
        </div>
        <div
          style={{ color: timerColor }}
          className={`
            text-sm font-extrabold tabular-nums tracking-widest
            ${isTimeCritical ? "animate-pulse" : ""}
          `}
        >
          {formatTime(timeLeft)}
        </div>
        <button
          onClick={onLeaveMatch}
          className="bg-transparent border border-[var(--hud-border)] text-[var(--hud-muted)] px-3 py-1 rounded-md cursor-pointer text-xs font-semibold transition-colors duration-200 hover:text-white"
        >
          Leave Match
        </button>
      </div>
    </div>
  );
};

export default RaceHUD;
