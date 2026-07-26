import { useState } from "react";

const ProblemPanel = ({
  leftWidth,
  problem,
  difficulty,
  companiesList = [],
  examples = [],
  constraints = [],
  hints = [],
  colors,
}) => {
  const [leftTab, setLeftTab] = useState("description");
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false);

  // Map theme states safely into simple classes
  const getDiffClasses = (diff) => {
    if (diff === "easy")
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    if (diff === "medium" || diff === "med")
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    if (diff === "hard")
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    return "bg-neutral-800 text-neutral-400 border-neutral-700";
  };
  const diffClasses = getDiffClasses(difficulty);

  const cleanDescription = problem?.description
    ?.replace(/Example \d+:/gi, "")
    ?.replace(/Constraints:/gi, "")
    ?.trim();

  return (
    <div
      style={{
        width: `${leftWidth}%`,
        "--panel-bg": colors.bgPanel,
        "--panel-border": colors.border,
        "--panel-header": colors.bgHeader,
        "--accent-color": colors.accent,
        "--text-muted": colors.textMuted,
      }}
      className="box-border bg-[var(--panel-bg)] border border-[var(--panel-border)] flex flex-col overflow-hidden rounded-lg font-mono"
    >
      {/* HEADER TABS */}
      <div className="flex bg-[var(--panel-header)] border-b border-[var(--panel-border)]">
        <button
          onClick={() => setLeftTab("description")}
          style={{
            borderTopColor:
              leftTab === "description" ? "var(--accent-color)" : "transparent",
          }}
          className={`px-4 py-2.5 bg-transparent border-t-2 border-x-none border-b-none text-xs font-semibold cursor-pointer transition-colors
            ${leftTab === "description" ? "bg-[var(--panel-bg)] text-white" : "text-[var(--text-muted)] hover:text-white"}
          `}
        >
          Description
        </button>
        <button
          onClick={() => setLeftTab("hints")}
          style={{
            borderTopColor:
              leftTab === "hints" ? "var(--accent-color)" : "transparent",
          }}
          className={`px-4 py-2.5 bg-transparent border-t-2 border-x-none border-b-none text-xs font-semibold cursor-pointer transition-colors
            ${leftTab === "hints" ? "bg-[var(--panel-bg)] text-white" : "text-[var(--text-muted)] hover:text-white"}
          `}
        >
          Hints {hints.length > 0 ? `(${hints.length})` : ""}
        </button>
      </div>

      {/* MAIN CONTENT WORKSPACE */}
      <div className="box-border flex-1 overflow-y-auto p-6 text-sm">
        {!problem ? (
          <div className="text-[var(--text-muted)]">Loading problem...</div>
        ) : leftTab === "description" ? (
          <>
            <h1 className="text-xl font-bold text-white mb-4">
              {problem.leetcode_id ? `${problem.leetcode_id}. ` : ""}
              {problem.title}
            </h1>

            {/* TAGS BAR */}
            <div className="flex gap-2 items-center mb-6">
              <span
                className={`text-xs px-3 py-1 border rounded-full font-semibold capitalize ${diffClasses}`}
              >
                {difficulty}
              </span>

              {/* COMPANIES DROP-DOWN BUTTON */}
              <div className="relative">
                <button
                  onClick={() => setIsCompaniesOpen(!isCompaniesOpen)}
                  className="text-xs px-3 py-1 bg-[#161616] border border-[var(--panel-border)] text-neutral-300 rounded-full font-semibold cursor-pointer flex items-center gap-1.5 transition-colors hover:border-[var(--text-muted)]"
                >
                  🏢 Companies{" "}
                  {companiesList.length > 0 ? `(${companiesList.length})` : ""}
                </button>

                {isCompaniesOpen && (
                  <div className="box-border absolute top-full left-0 mt-2 bg-neutral-900/85 backdrop-blur-md border border-[var(--panel-border)] rounded-lg p-4 z-50 min-w-[220px] shadow-[0_10px_40px_rgba(0,0,0,0.9)]">
                    <div className="text-[10px] text-[var(--text-muted)] mb-3 uppercase tracking-wider font-bold">
                      Asked By
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {companiesList.length > 0 ? (
                        companiesList.map((comp, i) => (
                          <span
                            key={i}
                            className="bg-[#2a2a2a] border border-[var(--panel-border)] px-2.5 py-1 rounded text-xs text-white"
                          >
                            {comp}
                          </span>
                        ))
                      ) : (
                        <span className="text-neutral-500 text-xs">
                          General Algorithm
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PROBLEM BODY DESCRIPTIONS */}
            <div className="text-neutral-300 leading-relaxed mb-8 white-space-pre-wrap font-sans">
              {cleanDescription}
            </div>

            {/* EXAMPLES CONTAINER */}
            {examples.length > 0 && (
              <div className="flex flex-col gap-4 mb-8">
                {examples.map((ex, idx) => (
                  <div key={idx}>
                    <div className="text-sm font-bold text-white mb-2">
                      Example {idx + 1}:
                    </div>
                    <div className="box-border bg-[#161616] border-l-4 border-[var(--panel-border)] p-4 text-xs text-neutral-200 white-space-pre-wrap rounded-r font-mono">
                      {ex.example_text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* CONSTRAINTS */}
            {constraints.length > 0 && (
              <div>
                <div className="text-sm font-bold text-white mb-3">
                  Constraints:
                </div>
                <ul className="pl-5 text-neutral-300 text-xs leading-relaxed font-mono list-disc">
                  {constraints.map((c, i) => (
                    <li key={i} className="mb-1">
                      <code className="bg-[#161616] px-1.5 py-0.5 rounded border border-[var(--panel-border)] text-neutral-200">
                        {c}
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          /* HINTS VIEW */
          <div className="flex flex-col gap-3">
            <div className="text-amber-400 text-xs mb-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-md">
              ⚠️ Using hints will not actually deduct ELO yet, but they will in
              the future! Use them strategically.
            </div>

            {hints.length > 0 ? (
              hints.map((hint, index) => (
                <div
                  key={index}
                  className="bg-[#161616] border border-[var(--panel-border)] p-4 rounded-lg text-neutral-300 leading-relaxed"
                >
                  <strong className="text-white block mb-1.5">
                    Hint {index + 1}
                  </strong>
                  {hint}
                </div>
              ))
            ) : (
              <div className="text-[var(--text-muted)] text-center mt-10">
                No hints available for this problem. You're on your own!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemPanel;

