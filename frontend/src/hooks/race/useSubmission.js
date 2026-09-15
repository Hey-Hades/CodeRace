import { useState } from "react";
import axios from "axios";

export const useSubmission = (
  socket,
  roomId,
  problem,
  isPractice,
  raceStarted,
  timeLeft,
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [caseResults, setCaseResults]   = useState([]); // per-case ✅❌
  const [myProgress, setMyProgress]     = useState(0);
  const [totalCases, setTotalCases]     = useState(5);

  // --- RUN SAMPLE CODE ---
  const handleRunCode = async (language, code) => {
    if (!raceStarted || isSubmitting || timeLeft === 0) return;

    setIsSubmitting(true);
    setCaseResults([]);
    setTerminalLogs([
      "> Initializing execution container...",
      "> Running against sample test cases...",
    ]);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://coderace-backend.onrender.com";
      const { data } = await axios.post(
        `${backendUrl}/api/code/run`,
        { language, code, problemId: problem?.id || "two-sum" },
      );

      if (data.success) {
        const logs = [
          data.allPassed
            ? `✅ All Sample Cases Passed (${data.passedCount}/${data.totalCount})`
            : `⚠️ Some Sample Cases Failed (${data.passedCount}/${data.totalCount})`,
        ];
        if (data.stdout) { logs.push(`\n--- Output (stdout) ---`); logs.push(data.stdout); }
        if (data.stderr) { logs.push(`\n--- Error (stderr) ---`);  logs.push(data.stderr); }
        setTerminalLogs(logs);
      } else {
        setTerminalLogs([`❌ Runtime Error`, data.error || data.details]);
      }
    } catch {
      setTerminalLogs([`🚨 Server Error: Could not reach execution engine.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SUBMIT FULL CODE ---
  const handleSubmitCode = async (language, code) => {
    if (!socket || !raceStarted || isSubmitting || timeLeft === 0) return;

    setIsSubmitting(true);
    setCaseResults([]);
    setTerminalLogs([
      "> Initializing execution container...",
      "> Compiling source code...",
    ]);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://coderace-backend.onrender.com";
      const { data } = await axios.post(
        `${backendUrl}/api/code/execute`,
        {
          language,
          code,
          problemId: problem?.id || "two-sum",
          roomId,
          userId: socket.id,
        },
      );

      if (data.success) {
        // Store per-case results for the ✅❌ grid
        if (data.caseResults?.length) setCaseResults(data.caseResults);

        const statusLine = data.allPassed
          ? `✅ Accepted — All ${data.totalCount} cases passed!`
          : `⚠️ Wrong Answer — ${data.passedCount}/${data.totalCount} cases passed`;

        setTerminalLogs([
          statusLine,
          `Execution Time: ${data.executionTimeMs}ms`,
        ]);
        setTotalCases(data.totalCount);

        if (data.passedCount > myProgress) {
          setMyProgress(data.passedCount);
          if (!isPractice) {
            socket.emit("progress_update", { roomId, progress: data.passedCount });
          }
        }

        if (data.allPassed) {
          socket.emit("player_won", {
            roomId,
            executionTimeMs: data.executionTimeMs,
            code,
            language,
          });
        }
      } else {
        setCaseResults([]);
        setTerminalLogs([`❌ Runtime Error`, data.error || data.details]);
      }
    } catch {
      setTerminalLogs([`🚨 Server Error: Could not reach execution engine.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    setIsSubmitting,
    terminalLogs,
    setTerminalLogs,
    caseResults,
    myProgress,
    totalCases,
    handleSubmitCode,
    handleRunCode,
  };
};
