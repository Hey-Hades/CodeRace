import React, { useState, useEffect } from "react";

const ConsolePanel = ({ bottomHeight, examples, terminalLogs, colors }) => {
  const [bottomTab, setBottomTab] = useState("testcases");
  const [activeCase, setActiveCase] = useState(0);

  useEffect(() => {
    if (terminalLogs && terminalLogs.length > 0) {
      setBottomTab("result");
    }
  }, [terminalLogs]);

  return (
    <div
      style={{
        height: `calc(${bottomHeight}% - 3px)`,
        "--panel-bg": colors.bgPanel,
        "--panel-border": colors.border,
        "--panel-header": colors.bgHeader,
        "--accent-color": colors.accent,
        "--text-muted": colors.textMuted,
        "--success-color": colors.success,
        "--fail-color": colors.fail,
      }}
      className="box-border bg-[var(--panel-bg)] border border-[var(--panel-border)] flex flex-col overflow-hidden rounded-lg font-mono"
    >
      {/* CONSOLE TAB HEADER */}
      <div className="flex bg-[var(--panel-header)] border-b border-[var(--panel-border)] shrink-0">
        <button
          onClick={() => setBottomTab("testcases")}
          style={{
            borderTopColor:
              bottomTab === "testcases" ? "var(--accent-color)" : "transparent",
          }}
          className={`px-5 py-2 text-xs font-semibold cursor-pointer border-t-2 border-x-none border-b-none transition-colors
            ${bottomTab === "testcases" ? "bg-[var(--panel-bg)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
        >
          Testcase
        </button>
        <button
          onClick={() => setBottomTab("result")}
          style={{
            borderTopColor:
              bottomTab === "result" ? "var(--accent-color)" : "transparent",
          }}
          className={`px-5 py-2 text-xs font-semibold cursor-pointer border-t-2 border-x-none border-b-none transition-colors
            ${bottomTab === "result" ? "bg-[var(--panel-bg)] text-white" : "text-[var(--text-muted)] hover:text-white"}`}
        >
          Test Result
        </button>
      </div>

      {/* CONSOLE WORKSPACE */}
      <div className="box-border flex-1 p-4 overflow-y-auto">
        {bottomTab === "testcases" && (
          <div className="flex flex-col">
            <div className="flex gap-2 mb-4">
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
                {examples[activeCase].example_text
                  .split("\n")[0]
                  .replace("Input: ", "")}
              </div>
            )}
          </div>
        )}

        {bottomTab === "result" && (
          <div className="font-mono text-xs">
            {terminalLogs.length === 0 ? (
              <span className="text-[var(--text-muted)]">
                You must run your code first.
              </span>
            ) : (
              <>
                {terminalLogs[0].includes("✅") && (
                  <div className="text-lg font-bold text-[var(--success-color)] mb-3">
                    Accepted
                  </div>
                )}
                {terminalLogs[0].includes("❌") && (
                  <div className="text-lg font-bold text-[var(--fail-color)] mb-3">
                    Runtime Error
                  </div>
                )}
                {terminalLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`box-border p-2.5 mb-2 rounded-md border border-[var(--panel-border)] bg-[#161616] whitespace-pre-wrap
                      ${
                        log.includes("❌") || log.includes("🚨")
                          ? "text-[var(--fail-color)]"
                          : log.includes("✅")
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

