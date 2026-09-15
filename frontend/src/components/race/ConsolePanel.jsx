import React, { useState, useEffect } from "react";

const ConsolePanel = ({
  bottomHeight,
  isMobile = false,
  examples,
  terminalLogs,
  caseResults = [],
  colors,
}) => {
  const [bottomTab, setBottomTab] = useState("testcases");
  const [activeCase, setActiveCase] = useState(0);

  // Auto-switch to result tab when logs arrive
  useEffect(() => {
    if (terminalLogs && terminalLogs.length > 0) {
      setBottomTab("result");
    }
  }, [terminalLogs]);

  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setBottomTab(id)}
      style={{ borderTopColor: bottomTab === id ? colors.accent : "transparent" }}
      className={`px-5 py-2 text-xs font-semibold cursor-pointer border-t-2 border-x-0 border-b-0 transition-colors
        ${bottomTab === id ? "bg-[var(--panel-bg)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
    >
      {label}
    </button>
  );

  // Determine overall result from caseResults or log text
  const isAccepted  = caseResults.length > 0 && caseResults.every((c) => c.passed);
  const isWrong     = caseResults.length > 0 && !isAccepted;
  const isRuntimeError = terminalLogs.some((l) => l.includes("❌") || l.includes("🚨"));

  return (
    <div
      style={{
        height: isMobile ? "100%" : `calc(${bottomHeight}% - 3px)`,
        "--panel-bg":      colors.bgPanel,
        "--panel-border":  colors.border,
        "--panel-header":  colors.bgHeader,
        "--accent-color":  colors.accent,
        "--text-muted":    colors.textMuted,
        "--success-color": colors.success,
        "--fail-color":    colors.fail,
      }}
      className="box-border bg-[var(--panel-bg)] border border-[var(--panel-border)] flex flex-col overflow-hidden rounded-lg font-mono"
    >
      {/* Header tabs */}
      <div className="flex bg-[var(--panel-header)] border-b border-[var(--panel-border)] shrink-0">
        <TabBtn id="testcases" label="Testcase" />
        <TabBtn id="result"    label="Test Result" />
      </div>

      {/* Content */}
      <div className="box-border flex-1 p-4 overflow-y-auto">

        {/* ── TESTCASE TAB ─────────────────────────────────────────── */}
        {bottomTab === "testcases" && (
          <div className="flex flex-col">
            <div className="flex gap-2 mb-4 flex-wrap">
              {examples.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCase(i)}
                  className={`text-xs px-4 py-1.5 rounded-md font-semibold cursor-pointer transition-colors
                    ${activeCase === i ? "bg-[#333] text-white" : "bg-[#1a1a1a] text-[var(--text-muted)]"}`}
                >
                  Case {i + 1}
                </button>
              ))}
            </div>
            {examples[activeCase] && (
              <div className="box-border bg-[#161616] p-3 rounded-md border border-[var(--panel-border)] font-mono text-xs text-neutral-200 whitespace-pre-wrap">
                {examples[activeCase].example_text?.split("\n")[0]?.replace("Input: ", "")}
              </div>
            )}
          </div>
        )}

        {/* ── TEST RESULT TAB ──────────────────────────────────────── */}
        {bottomTab === "result" && (
          <div className="font-mono text-xs">
            {terminalLogs.length === 0 ? (
              <span className="text-[var(--text-muted)]">Run or Submit your code to see results.</span>
            ) : (
              <>
                {/* ── Status banner ────────────────────────────────── */}
                {isAccepted && (
                  <div className="text-lg font-bold mb-3" style={{ color: colors.success }}>
                    ✅ Accepted
                  </div>
                )}
                {isWrong && (
                  <div className="text-lg font-bold mb-3" style={{ color: colors.fail }}>
                    ❌ Wrong Answer
                  </div>
                )}
                {isRuntimeError && !isWrong && !isAccepted && (
                  <div className="text-lg font-bold mb-3" style={{ color: colors.fail }}>
                    💥 Runtime Error
                  </div>
                )}

                {/* ── Per-case grid (shown after Submit) ───────────── */}
                {caseResults.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {caseResults.map((c) => (
                      <div
                        key={c.index}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border"
                        style={{
                          background:   c.passed ? "#0a1a0a" : "#1a0a0a",
                          borderColor:  c.passed ? "#2d5a2d" : "#5a1a1a",
                          color:        c.passed ? colors.success : colors.fail,
                        }}
                      >
                        <span>{c.passed ? "✅" : "❌"}</span>
                        <span>Case {c.index + 1}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Log lines ────────────────────────────────────── */}
                {terminalLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`box-border p-2.5 mb-2 rounded-md border border-[var(--panel-border)] bg-[#161616] whitespace-pre-wrap
                      ${log.includes("❌") || log.includes("🚨") || log.includes("💥")
                          ? "text-[var(--fail-color)]"
                          : log.includes("✅") || log.includes("🏆")
                            ? "text-[var(--success-color)]"
                            : "text-neutral-300"
                      }`}
                  >
                    {log}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsolePanel;
