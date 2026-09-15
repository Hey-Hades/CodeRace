import React from "react";

const LobbyForm = ({
  isPracticeMode,
  multiplayerMode,
  playerName,
  difficulty,
  company,
  companies = [],
  companiesLoading = false,
  matchType,
  customTime,
  roomCodeInput,
  focusedInput,
  lobbyError,
  isRequestingRoom,
  isNameLocked,
  primaryText,
  onModeChange,
  onPlayerNameChange,
  onDifficultyChange,
  onCompanyChange,
  onMatchTypeChange,
  onCustomTimeChange,
  onRoomCodeChange,
  onFocusChange,
  onSubmit,
}) => {
  const getButtonClasses = (level, currentVal) => {
    const isSelected = currentVal === level;
    const base = "flex-1 p-2.5 text-xs font-semibold cursor-pointer rounded-lg transition-all font-inherit";
    if (!isSelected) return `${base} bg-[#0a0a0a] border border-[#1e1e1e] text-[#666] hover:border-[#333] hover:text-[#999]`;
    if (level === "easy") return `${base} bg-[#0a1a0a] border border-[#2d5a2d] text-[#4caf50]`;
    if (level === "hard") return `${base} bg-[#1a0000] border border-[#3a0a0a] text-[#f44336]`;
    return `${base} bg-[#1a0f0a] border border-[#ff6b2b44] text-[#ff6b2b]`;
  };

  const getInputClasses = (id) => {
    const borderClass = focusedInput === id ? "border-[#ff6b2b]" : "border-[#1e1e1e]";
    return `w-full bg-[#0a0a0a] border ${borderClass} rounded-lg text-white text-[13px] px-3.5 py-2.5 outline-none font-inherit transition-colors box-border placeholder:text-[#444] focus:border-[#ff6b2b]`;
  };

  const label = "block text-[10px] text-[#666] uppercase tracking-[1px] mb-1.5 font-semibold";

  // Company chip: "All" gets a slightly different treatment
  const getCompanyChipClass = (name) => {
    const isSelected = company === name;
    const base = "px-3 py-1.5 text-[11px] font-semibold rounded-lg cursor-pointer transition-all border whitespace-nowrap";
    if (isSelected && name === "All")
      return `${base} bg-[#1a0f0a] border-[#ff6b2b66] text-[#ff6b2b]`;
    if (isSelected)
      return `${base} bg-[#111a0a] border-[#3a6a2a] text-[#6fcf5f]`;
    return `${base} bg-[#0a0a0a] border-[#1e1e1e] text-[#666] hover:border-[#333] hover:text-[#aaa]`;
  };

  return (
    <>
      {/* Header */}
      <div className="mb-4">
        <div className="text-[11px] text-[#555] tracking-[1px] uppercase mb-1.5 font-semibold">
          {isPracticeMode ? "Solo Training" : "Multiplayer Arena"}
        </div>
        <div className="text-2xl sm:text-[26px] font-extrabold text-white leading-[1.2] mb-1 tracking-[-0.5px]">
          {isPracticeMode ? "Hone your skills." : multiplayerMode === "create" ? "Set up your match." : "Join the arena."}
        </div>
        <div className="text-xs text-[#777] leading-[1.5]">
          {isPracticeMode
            ? "Select a difficulty and target company to begin your offline practice session."
            : multiplayerMode === "create"
              ? "Configure the match settings to generate a secure room code for your opponent."
              : "Enter the room code provided by your opponent to join their match."}
        </div>
      </div>

      {/* Mode Toggle */}
      {!isPracticeMode && (
        <div className="flex bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-1 mb-3">
          {["create", "join"].map((mode) => (
            <button
              key={mode}
              onClick={() => { onModeChange(mode); onFocusChange(null); }}
              className={`flex-1 p-2 text-xs font-semibold border-none rounded-md cursor-pointer transition-all ${
                multiplayerMode === mode ? "bg-[#1a0f0a] text-[#ff6b2b]" : "bg-transparent text-[#666] hover:text-[#999]"
              }`}
            >
              {mode === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>
      )}

      {/* Player Name */}
      {!isNameLocked && (
        <div className="mb-3">
          <label className={label}>Your Name</label>
          <input
            placeholder="Hey-Hades"
            className={getInputClasses("name")}
            value={playerName}
            onChange={(e) => onPlayerNameChange(e.target.value)}
            onFocus={() => onFocusChange("name")}
            onBlur={() => onFocusChange(null)}
            disabled={isRequestingRoom || isNameLocked}
          />
        </div>
      )}

      {/* Settings — Create / Practice only */}
      {(isPracticeMode || multiplayerMode === "create") && (
        <>
          {/* Difficulty */}
          <div className="mb-3">
            <label className={label}>Difficulty</label>
            <div className="flex gap-1.5">
              {["easy", "med", "hard"].map((lvl) => (
                <button key={lvl} disabled={isRequestingRoom} onClick={() => onDifficultyChange(lvl)} className={getButtonClasses(lvl, difficulty)}>
                  {lvl === "med" ? "Medium" : lvl.charAt(0).toUpperCase() + lvl.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Time Control */}
          <div className="mb-3">
            <label className={label}>Time Control</label>
            <div className="grid grid-cols-2 gap-1.5">
              {["Bullet (5 min)", "Blitz (15 min)", "Rapid (30 min)", "Zen (No Limit)"].map((time) => (
                <button key={time} disabled={isRequestingRoom} onClick={() => onMatchTypeChange(time)} className={getButtonClasses(time, matchType)}>
                  {time === "Zen (No Limit)" ? "Zen (∞)" : time}
                </button>
              ))}

              {/* Custom slider */}
              <div
                onClick={() => !isRequestingRoom && onMatchTypeChange("Custom")}
                className={`col-span-2 flex flex-col justify-center px-3 py-2 rounded-lg cursor-pointer transition-all ${
                  matchType === "Custom" ? "bg-[#1a0f0a] border border-[#ff6b2b44]" : "bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#333]"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-semibold ${matchType === "Custom" ? "text-[#ff6b2b]" : "text-[#666]"}`}>Custom Minutes</span>
                  <span className={`text-xs font-bold ${matchType === "Custom" ? "text-white" : "text-[#555]"}`}>
                    {customTime || 10} <span className="text-[10px] font-normal text-[#666]">min</span>
                  </span>
                </div>
                <input
                  type="range" min="1" max="180" value={customTime || 10}
                  disabled={isRequestingRoom}
                  onChange={(e) => { onCustomTimeChange(e.target.value); onMatchTypeChange("Custom"); }}
                  className={`w-full h-1 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer outline-none
                    ${matchType === "Custom" ? "[&::-webkit-slider-thumb]:bg-[#ff6b2b]" : "[&::-webkit-slider-thumb]:bg-[#444]"}
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all
                    hover:[&::-webkit-slider-thumb]:scale-125 active:[&::-webkit-slider-thumb]:scale-90
                    ${matchType === "Custom" ? "[&::-moz-range-thumb]:bg-[#ff6b2b]" : "[&::-moz-range-thumb]:bg-[#444]"}
                    [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:rounded-full`}
                />
              </div>
            </div>
          </div>

          {/* ── Target Company — dynamic chip grid ──────────────────── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className={label} style={{ marginBottom: 0 }}>Target Company</label>
              {!companiesLoading && companies.length > 0 && (
                <span className="text-[10px] text-[#444]">{companies.length} companies</span>
              )}
            </div>

            {companiesLoading ? (
              /* Skeleton loading chips */
              <div className="flex flex-wrap gap-1.5">
                {[48, 64, 52, 72, 56, 60].map((w, i) => (
                  <div
                    key={i}
                    className="h-[30px] rounded-lg bg-[#111] border border-[#1e1e1e] animate-pulse"
                    style={{ width: w }}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {/* All Companies chip */}
                <button
                  disabled={isRequestingRoom}
                  onClick={() => onCompanyChange("All")}
                  className={getCompanyChipClass("All")}
                >
                  🌐 All
                </button>

                {/* Dynamic company chips */}
                {companies.map((c) => (
                  <button
                    key={c}
                    disabled={isRequestingRoom}
                    onClick={() => onCompanyChange(c)}
                    className={getCompanyChipClass(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Selected company indicator */}
            {company !== "All" && !companiesLoading && (
              <div className="mt-1.5 text-[10px] text-[#555]">
                Filtering problems tagged with <span className="text-[#6fcf5f] font-semibold">{company}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Join Room Code */}
      {!isPracticeMode && multiplayerMode === "join" && (
        <div className="mb-4">
          <label className={label}>Room Code</label>
          <input
            placeholder="RACE17"
            className={`${getInputClasses("code")} uppercase tracking-[2px]`}
            value={roomCodeInput}
            disabled={isRequestingRoom}
            onChange={(e) => onRoomCodeChange(e.target.value)}
            onFocus={() => onFocusChange("code")}
            onBlur={() => onFocusChange(null)}
          />
        </div>
      )}

      {/* Error */}
      {lobbyError && (
        <div className="text-[#ef4743] text-[13px] mb-3 text-center font-semibold">{lobbyError}</div>
      )}

      {/* Submit */}
      <button
        disabled={isRequestingRoom}
        onClick={onSubmit}
        className={`w-full py-3 rounded-lg text-white text-sm font-bold shadow-[0_4px_14px_rgba(255,107,43,0.2)] transition-all ${
          isRequestingRoom ? "bg-[#ff6b2b] opacity-70 cursor-not-allowed" : "bg-[#ff6b2b] hover:bg-[#ff824d] active:scale-95"
        }`}
      >
        {primaryText}
      </button>
    </>
  );
};

export default LobbyForm;
