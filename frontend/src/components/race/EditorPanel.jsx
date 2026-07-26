import { useState } from "react";
import Editor from "@monaco-editor/react";

const EditorPanel = ({
  bottomHeight,
  raceStarted,
  timeLeft,
  language,
  availableLanguages,
  handleLanguageSelect,
  handleResetCode,
  code,
  handleCodeChange,
  handleEditorWillMount,
  handleEditorDidMount,
  colors,
}) => {
  const [isLangOpen, setIsLangOpen] = useState(false);
  const selectedLangLabel =
    availableLanguages.find((l) => l.id === language)?.label || "C++";
  const isEditorReadOnly = !raceStarted || timeLeft === 0;

  return (
    <div
      style={{
        height: `calc(${100 - bottomHeight}% - 3px)`,
        "--panel-bg": colors.bgPanel,
        "--panel-border": colors.border,
        "--panel-header": colors.bgHeader,
        "--text-muted": colors.textMuted,
      }}
      className="box-border bg-[var(--panel-bg)] border border-[var(--panel-border)] flex flex-col overflow-hidden rounded-lg font-mono"
    >
      {/* EDITOR CONTROL HEADER TOOLBAR */}
      <div className="box-border flex items-center justify-between px-3 py-1.5 bg-[var(--panel-header)] border-b border-[var(--panel-border)]">
        {/* LANGUAGE SELECT DROPDOWN */}
        <div className="relative">
          <button
            onClick={() => setIsLangOpen(!isLangOpen)}
            disabled={!raceStarted}
            className={`bg-transparent border-none text-white text-xs px-3 py-1.5 rounded font-semibold flex items-center gap-2 transition-colors
              ${raceStarted ? "cursor-pointer hover:bg-neutral-800" : "cursor-not-allowed opacity-50"}
            `}
          >
            {selectedLangLabel}{" "}
            <span className="text-[9px] text-neutral-500">▼</span>
          </button>

          {isLangOpen && raceStarted && (
            <div className="box-border absolute top-full left-0 mt-1 bg-neutral-900 border border-[var(--panel-border)] rounded-md overflow-hidden z-50 min-w-[120px] shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
              {availableLanguages.map((lang) => {
                const isSelected = language === lang.id;
                return (
                  <div
                    key={lang.id}
                    onClick={() => {
                      handleLanguageSelect(lang.id);
                      setIsLangOpen(false);
                    }}
                    className={`px-4 py-2.5 text-xs text-neutral-200 cursor-pointer transition-colors hover:bg-neutral-700
                      ${isSelected ? "bg-neutral-800 font-bold" : "bg-transparent font-medium"}
                    `}
                  >
                    {lang.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* CODE SNIPPET RESET BUTTON */}
        <button
          onClick={handleResetCode}
          title="Reset to original snippet"
          disabled={!raceStarted}
          className={`bg-transparent border-none text-[var(--text-muted)] flex items-center gap-1.5 transition-colors hover:text-white
            ${raceStarted ? "cursor-pointer" : "cursor-not-allowed opacity-50"}
          `}
        >
          <span className="text-base">↺</span>
          <span className="text-xs font-semibold">Reset</span>
        </button>
      </div>

      {/* MONACO WORKSPACE MOUNT ENVIRONMENT */}
      <div className="box-border flex-1 py-2">
        <Editor
          height="100%"
          width="100%"
          theme="codeRaceTheme"
          language={language === "python" ? "python" : language}
          value={code}
          onChange={handleCodeChange}
          beforeMount={handleEditorWillMount}
          handleEditorDidMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            scrollBeyondLastLine: false,
            readOnly: isEditorReadOnly,
          }}
        />
      </div>
    </div>
  );
};

export default EditorPanel;
