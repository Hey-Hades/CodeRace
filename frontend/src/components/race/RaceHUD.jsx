import React from "react";
import { useIsMobile } from "../../hooks/useIsMobile.js";

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
  // Mobile tab switching
  mobileTab,
  setMobileTab,
}) => {
  const isMobile = useIsMobile(768);
  const isDisabled  = !raceStarted || isSubmitting || timeLeft === 0;
  const isTimeCritical = timeLeft <= 60 && timeLeft > 0;
  const timerColor  = timeLeft <= 60 && timeLeft !== -1 ? colors.fail : colors.textMain;

  const getPingColor = () => {
    if (ping < 80)  return colors.success;
    if (ping < 150) return colors.warning;
    return colors.fail;
  };

  // ─── Shared button classes ───────────────────────────────────────────────
  const runBtnClass = `
    px-3 py-1.5 text-xs bg-[#1a1a1a] text-[#e8e8e8] border border-[#333] rounded-md font-semibold
    flex items-center gap-1.5 transition-all
    ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-[#2a2a2a] hover:border-[#555]"}
  `;
  const submitBtnClass = `
    px-3.5 py-1.5 text-xs bg-emerald-500/10 text-[${colors.success}] border border-emerald-500/30 rounded-md font-semibold
    flex items-center gap-1.5 transition-all
    ${isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-emerald-500/20 hover:border-emerald-500/60"}
  `;

  // ─── Mobile tab button helper ────────────────────────────────────────────
  const MobileTabBtn = ({ id, label }) => (
    <button
      onClick={() => setMobileTab(id)}
      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded transition-all border-none cursor-pointer font-mono
        ${mobileTab === id
          ? "bg-[#ff6b2b22] text-[#ff6b2b]"
          : "bg-transparent text-[#555] hover:text-[#999]"
        }`}
    >
      {label}
    </button>
  );

  // ─── MOBILE LAYOUT (< 768 px) ───────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        style={{
          "--hud-border": colors.border,
          "--hud-bg": colors.bgApp,
        }}
        className="box-border border-b border-[var(--hud-border)] bg-[var(--hud-bg)] shrink-0 z-50 font-mono"
      >
        {/* Row 1 — Actions + Timer + Leave */}
        <div className="flex items-center justify-between px-3 h-[46px]">
          {/* Run + Submit */}
          <div className="flex items-center gap-2">
            {isSubmitting && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b2b] animate-pulse" />
            )}
            <button onClick={handleRunCode} disabled={isDisabled} className={runBtnClass}>
              <span className="text-[10px] text-[#888]">▶</span> Run
            </button>
            <button onClick={handleSubmitCode} disabled={isDisabled} className={submitBtnClass}>
              Submit
            </button>
          </div>

          {/* Timer + Leave */}
          <div className="flex items-center gap-3">
            <div
              style={{ color: timerColor }}
              className={`text-sm font-extrabold tabular-nums tracking-widest ${isTimeCritical ? "animate-pulse" : ""}`}
            >
              {formatTime(timeLeft)}
            </div>
            <button
              onClick={onLeaveMatch}
              className="bg-transparent border border-[var(--hud-border)] text-[#666] px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer hover:text-white transition-colors"
            >
              Leave
            </button>
          </div>
        </div>

        {/* Row 2 — Progress bars (only in 1v1) */}
        {!isPractice && (
          <div className="flex items-center gap-3 px-3 pb-1.5">
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[9px] text-[#555] font-semibold uppercase">You</span>
              <div className="flex-1 h-0.5 bg-[#222] rounded-full overflow-hidden">
                <div
                  style={{ width: `${(myProgress / totalCases) * 100}%`, backgroundColor: colors.accent }}
                  className="h-full transition-[width] duration-300 ease-out"
                />
              </div>
              <span className="text-[10px] font-bold" style={{ color: colors.accent }}>{myProgress}</span>
            </div>
            <span className="text-[9px] text-[#333] font-black">VS</span>
            <div className="flex items-center gap-1.5 flex-1">
              <span className="text-[10px] font-bold" style={{ color: colors.success }}>{opponentProgress}</span>
              <div className="flex-1 h-0.5 bg-[#222] rounded-full overflow-hidden">
                <div
                  style={{ width: `${(opponentProgress / totalCases) * 100}%`, backgroundColor: colors.success }}
                  className="h-full transition-[width] duration-300 ease-out"
                />
              </div>
              <span className="text-[9px] text-[#555] font-semibold uppercase">Opp</span>
            </div>
          </div>
        )}

        {/* Row 3 — Tab switcher (Problem | Editor | Console) */}
        <div className="flex border-t border-[var(--hud-border)] px-2 py-1 gap-1">
          <MobileTabBtn id="problem"  label="Problem" />
          <MobileTabBtn id="editor"   label="Editor" />
          <MobileTabBtn id="console"  label="Console" />
        </div>
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (≥ 768 px) ──────────────────────────────────────────
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
      {/* 1. Progress (left) */}
      <div className="flex-1 flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--hud-muted)] font-semibold">You</span>
          <div className="w-[100px] h-1 bg-[#222] rounded-full overflow-hidden">
            <div
              style={{ width: `${(myProgress / totalCases) * 100}%` }}
              className="h-full bg-[var(--hud-accent)] transition-[width] duration-300 ease-out"
            />
          </div>
          <span className="text-xs font-bold" style={{ color: colors.accent }}>{myProgress}</span>
        </div>
        {!isPractice && (
          <>
            <span className="text-xs text-[#444] font-black select-none">VS</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold" style={{ color: colors.success }}>{opponentProgress}</span>
              <div className="w-[100px] h-1 bg-[#222] rounded-full overflow-hidden">
                <div
                  style={{ width: `${(opponentProgress / totalCases) * 100}%` }}
                  className="h-full bg-[var(--hud-success)] transition-[width] duration-300 ease-out"
                />
              </div>
              <span className="text-xs text-[var(--hud-muted)] font-semibold">Opponent</span>
            </div>
          </>
        )}
      </div>

      {/* 2. Actions (center) */}
      <div className="flex-1 flex justify-center items-center gap-3">
        {isSubmitting && (
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--hud-accent)] animate-pulse" />
        )}
        <button onClick={handleRunCode} disabled={isDisabled} className={runBtnClass}>
          <span className="text-[10px] text-[#888]">▶</span> Run
        </button>
        <button onClick={handleSubmitCode} disabled={isDisabled} className={submitBtnClass}>
          Submit
        </button>
      </div>

      {/* 3. Timer + Ping + Leave (right) */}
      <div className="flex-1 flex justify-end items-center gap-6">
        <span className="text-xs" style={{ color: colors.textMuted }}>
          Ping <span style={{ color: getPingColor(), fontWeight: "bold" }}>{ping}ms</span>
        </span>
        <div
          style={{ color: timerColor }}
          className={`text-sm font-extrabold tabular-nums tracking-widest ${isTimeCritical ? "animate-pulse" : ""}`}
        >
          {formatTime(timeLeft)}
        </div>
        <button
          onClick={onLeaveMatch}
          className="bg-transparent border border-[var(--hud-border)] text-[var(--hud-muted)] px-3 py-1 rounded-md cursor-pointer text-xs font-semibold transition-colors hover:text-white"
        >
          Leave Match
        </button>
      </div>
    </div>
  );
};

export default RaceHUD;
