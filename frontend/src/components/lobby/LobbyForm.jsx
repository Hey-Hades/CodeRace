import React from "react";

const LobbyForm = ({
  isPracticeMode,
  multiplayerMode,
  playerName,
  difficulty,
  company,
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
  // --- Tailwind Class Helpers ---
  const getButtonClasses = (level, currentVal) => {
    const isSelected = currentVal === level;
    const base =
      "flex-1 p-3 text-xs font-semibold cursor-pointer rounded-lg transition-all font-inherit";

    if (!isSelected) {
      return `${base} bg-[#0a0a0a] border border-[#1e1e1e] text-[#666] hover:border-[#333] hover:text-[#999]`;
    }
    if (level === "easy") {
      return `${base} bg-[#0a1a0a] border border-[#2d5a2d] text-[#4caf50]`;
    }
    if (level === "hard") {
      return `${base} bg-[#1a0000] border border-[#3a0a0a] text-[#f44336]`;
    }
    return `${base} bg-[#1a0f0a] border border-[#ff6b2b44] text-[#ff6b2b]`;
  };

  const getInputClasses = (id) => {
    const borderClass =
      focusedInput === id ? "border-[#ff6b2b]" : "border-[#1e1e1e]";
    return `w-full bg-[#0a0a0a] border ${borderClass} rounded-lg text-white text-[13px] px-3.5 py-3 outline-none font-inherit transition-colors box-border placeholder:text-[#444] focus:border-[#ff6b2b]`;
  };

  return (
    <>
      {/* Header Section */}
      <div className="mb-6">
        <div className="text-[11px] text-[#555] tracking-[1px] uppercase mb-2 font-semibold">
          {isPracticeMode ? "Solo Training" : "Multiplayer Arena"}
        </div>
        <div className="text-[28px] font-extrabold text-white leading-[1.2] mb-1.5 tracking-[-0.5px]">
          {isPracticeMode
            ? "Hone your skills."
            : multiplayerMode === "create"
              ? "Set up your match."
              : "Join the arena."}
        </div>
        <div className="text-xs text-[#777] leading-[1.6]">
          {isPracticeMode
            ? "Select a difficulty and target company to begin your offline practice session."
            : multiplayerMode === "create"
              ? "Configure the match settings to generate a secure room code for your opponent."
              : "Enter the room code provided by your opponent to join their match."}
        </div>
      </div>

      {/* Mode Toggle (Create/Join) */}
      {!isPracticeMode && (
        <div className="flex bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg p-1 mb-4">
          <button
            onClick={() => {
              onModeChange("create");
              onFocusChange(null);
            }}
            className={`flex-1 p-2.5 text-xs font-semibold border-none rounded-md cursor-pointer transition-all ${
              multiplayerMode === "create"
                ? "bg-[#1a0f0a] text-[#ff6b2b]"
                : "bg-transparent text-[#666] hover:text-[#999]"
            }`}
          >
            Create Room
          </button>
          <button
            onClick={() => {
              onModeChange("join");
              onFocusChange(null);
            }}
            className={`flex-1 p-2.5 text-xs font-semibold border-none rounded-md cursor-pointer transition-all ${
              multiplayerMode === "join"
                ? "bg-[#1a0f0a] text-[#ff6b2b]"
                : "bg-transparent text-[#666] hover:text-[#999]"
            }`}
          >
            Join Room
          </button>
        </div>
      )}

      {/* Player Name Input */}
      {!isNameLocked && (
        <div className="mb-4">
          <label className="block text-[10px] text-[#666] uppercase tracking-[1px] mb-2 font-semibold">
            Your Name
          </label>
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

      {/* Settings (Practice & Create Room Only) */}
      {(isPracticeMode || multiplayerMode === "create") && (
        <>
          <div className="mb-4">
            <label className="block text-[10px] text-[#666] uppercase tracking-[1px] mb-2 font-semibold">
              Difficulty
            </label>
            <div className="flex gap-1.5">
              <button
                disabled={isRequestingRoom}
                onClick={() => onDifficultyChange("easy")}
                className={getButtonClasses("easy", difficulty)}
              >
                Easy
              </button>
              <button
                disabled={isRequestingRoom}
                onClick={() => onDifficultyChange("med")}
                className={getButtonClasses("med", difficulty)}
              >
                Medium
              </button>
              <button
                disabled={isRequestingRoom}
                onClick={() => onDifficultyChange("hard")}
                className={getButtonClasses("hard", difficulty)}
              >
                Hard
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-[10px] text-[#666] uppercase tracking-[1px] mb-2 font-semibold">
              Time Control
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Presets */}
              {[
                "Bullet (5 min)",
                "Blitz (15 min)",
                "Rapid (30 min)",
                "Zen (No Limit)",
              ].map((time) => (
                <button
                  key={time}
                  disabled={isRequestingRoom}
                  onClick={() => onMatchTypeChange(time)}
                  className={getButtonClasses(time, matchType)}
                >
                  {time === "Zen (No Limit)" ? "Zen (∞)" : time}
                </button>
              ))}

              {/* Premium Slider for Custom Time */}
              <div
                onClick={() => !isRequestingRoom && onMatchTypeChange("Custom")}
                className={`col-span-2 flex flex-col justify-center px-4 py-3 h-[60px] rounded-lg cursor-pointer transition-all ${
                  matchType === "Custom"
                    ? "bg-[#1a0f0a] border border-[#ff6b2b44]"
                    : "bg-[#0a0a0a] border border-[#1e1e1e] hover:border-[#333]"
                }`}
              >
                <div className="flex justify-between items-center mb-2.5">
                  <span
                    className={`text-xs font-semibold transition-colors ${
                      matchType === "Custom" ? "text-[#ff6b2b]" : "text-[#666]"
                    }`}
                  >
                    Custom Minutes
                  </span>
                  <span
                    className={`text-xs font-bold transition-colors ${
                      matchType === "Custom" ? "text-white" : "text-[#555]"
                    }`}
                  >
                    {customTime || 10}{" "}
                    <span className="text-[10px] font-normal text-[#666]">
                      min
                    </span>
                  </span>
                </div>

                <input
                  type="range"
                  min="1"
                  max="180"
                  value={customTime || 10}
                  disabled={isRequestingRoom}
                  onChange={(e) => {
                    onCustomTimeChange(e.target.value);
                    onMatchTypeChange("Custom");
                  }}
                  className={`w-full h-1 bg-[#1e1e1e] rounded-lg appearance-none cursor-pointer outline-none transition-all
                    ${matchType === "Custom" ? "[&::-webkit-slider-thumb]:bg-[#ff6b2b]" : "[&::-webkit-slider-thumb]:bg-[#444]"}
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:transition-all
                    hover:[&::-webkit-slider-thumb]:scale-125 active:[&::-webkit-slider-thumb]:scale-90
                    ${matchType === "Custom" ? "hover:[&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,43,0.6)]" : ""}
                    
                    ${matchType === "Custom" ? "[&::-moz-range-thumb]:bg-[#ff6b2b]" : "[&::-moz-range-thumb]:bg-[#444]"}
                    [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:border-none 
                    [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:transition-all
                    hover:[&::-moz-range-thumb]:scale-125 active:[&::-moz-range-thumb]:scale-90`}
                />
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-[10px] text-[#666] uppercase tracking-[1px] mb-2 font-semibold">
              Target Company
            </label>
            <select
              value={company}
              disabled={isRequestingRoom}
              onChange={(e) => onCompanyChange(e.target.value)}
              className={`${getInputClasses("company")} cursor-pointer appearance-none`}
              onFocus={() => onFocusChange("company")}
              onBlur={() => onFocusChange(null)}
            >
              <option value="All">All Companies (Random)</option>
              <option value="Amazon">Amazon</option>
              <option value="Apple">Apple</option>
              <option value="Google">Google</option>
              <option value="Microsoft">Microsoft</option>
            </select>
          </div>
        </>
      )}

      {/* Join Room Code Input */}
      {!isPracticeMode && multiplayerMode === "join" && (
        <div className="mb-5">
          <label className="block text-[10px] text-[#666] uppercase tracking-[1px] mb-2 font-semibold">
            Room Code
          </label>
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

      {/* Error Display */}
      {lobbyError && (
        <div className="text-[#ef4743] text-[13px] mb-4 text-center font-semibold">
          {lobbyError}
        </div>
      )}

      {/* Submit Button */}
      <button
        disabled={isRequestingRoom}
        onClick={onSubmit}
        className={`w-full py-3.5 rounded-lg text-white text-sm font-bold shadow-[0_4px_14px_rgba(255,107,43,0.2)] transition-all
          ${
            isRequestingRoom
              ? "bg-[#ff6b2b] opacity-70 cursor-not-allowed"
              : "bg-[#ff6b2b] hover:bg-[#ff824d] active:scale-95"
          }`}
      >
        {primaryText}
      </button>
    </>
  );
};

export default LobbyForm;
