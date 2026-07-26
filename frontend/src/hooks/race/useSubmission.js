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
  const [myProgress, setMyProgress] = useState(0);
  const [totalCases, setTotalCases] = useState(5);

  // --- NEW: RUN SAMPLE CODE ---
  const handleRunCode = async (language, code) => {
    if (!raceStarted || isSubmitting || timeLeft === 0) return;

    setIsSubmitting(true);
    setTerminalLogs([
      "> Initializing execution container...",
      "> Running against sample test cases...",
    ]);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/code/run`,
        {
          language,
          code,
          problemId: problem?.id || "two-sum",
        },
      );

      if (data.success) {
        const logs = [
          data.allPassed
            ? `✅ All Sample Cases Passed (${data.passedCount}/${data.totalCount})`
            : `⚠️ Some Sample Cases Failed (${data.passedCount}/${data.totalCount})`,
        ];

        if (data.stdout) {
          logs.push(`\n--- Output (stdout) ---`);
          logs.push(data.stdout);
        }
        if (data.stderr) {
          logs.push(`\n--- Error (stderr) ---`);
          logs.push(data.stderr);
        }

        setTerminalLogs(logs);
      } else {
        setTerminalLogs([`❌ Runtime Error`, data.error || data.details]);
      }
    } catch (error) {
      setTerminalLogs([`🚨 Server Error: Could not reach execution engine.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- EXISTING: SUBMIT FULL CODE ---
  const handleSubmitCode = async (language, code) => {
    if (!socket || !raceStarted || isSubmitting || timeLeft === 0) return;

    setIsSubmitting(true);
    setTerminalLogs([
      "> Initializing execution container...",
      "> Compiling source code...",
    ]);

    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/code/execute`,
        {
          language,
          code,
          problemId: problem?.id || "two-sum",
          roomId,
          userId: socket.id,
        },
      );

      if (data.success) {
        setTerminalLogs([
          `✅ Accepted`,
          `Execution Time: ${data.executionTimeMs}ms`,
          `Passed Cases: ${data.passedCount}/${data.totalCount}`,
        ]);
        setTotalCases(data.totalCount);

        if (data.passedCount > myProgress) {
          setMyProgress(data.passedCount);
          if (!isPractice) {
            socket.emit("progress_update", {
              roomId,
              progress: data.passedCount,
            });
          }
        }

        // --- THE MISSING WIN TRIGGER ---
        if (data.passedCount === data.totalCount) {
          // We pass all cases! Tell the server we won.
          socket.emit("player_won", {
            roomId,
            executionTimeMs: data.executionTimeMs,
          });
        }
        // -------------------------------
      } else {
        setTerminalLogs([`❌ Runtime Error`, data.error || data.details]);
      }
    } catch (error) {
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
    myProgress,
    totalCases,
    handleSubmitCode,
    handleRunCode,
  };
};

