import { GoogleGenAI } from "@google/genai";

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function makeHint(problem, hintType) {
  if (!gemini) return fallbackHint(problem, hintType);

  const prompt = `
You are helping a student during a live multiplayer coding race.

Rules:
- Do not give the full solution.
- Do not write complete code.
- Give exactly one short hint.
- Keep it under 35 words.
- The hint type is: ${hintType}.

Problem:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Statement: ${problem.statement}
Input format: ${problem.inputFormat}
Output format: ${problem.outputFormat}

Return only the hint text.
`;

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: prompt
    });

    return response.text?.trim() || fallbackHint(problem, hintType);
  } catch (error) {
    console.error("Gemini hint error:", error.message);
    return fallbackHint(problem, hintType);
  }
}

export async function reviewMatch(room, players) {
  if (!gemini) return fallbackReview(room, players);

  const playerSummary = players
    .map(
      (player) =>
        `${player.name}: score=${player.score}, passed=${player.passedTests}/${player.totalTests}, submissions=${player.submissions}, hints=${player.hintsUsed}, hintPenalty=${player.hintPenalty}`
    )
    .join("\n");

  const prompt = `
You are an interviewer reviewing a competitive coding race.

Problem:
Title: ${room.problem?.title}
Difficulty: ${room.problem?.difficulty}
Statement: ${room.problem?.statement}

Player results:
${playerSummary}

Write a concise post-match review with:
1. Winner summary
2. Correct approach
3. Time and space complexity
4. Important edge cases
5. Interview advice

Do not include markdown tables. Keep the review under 180 words.
`;

  try {
    const response = await gemini.models.generateContent({
      model,
      contents: prompt
    });

    return response.text?.trim() || fallbackReview(room, players);
  } catch (error) {
    console.error("Gemini review error:", error.message);
    return fallbackReview(room, players);
  }
}

function fallbackHint(problem, hintType) {
  return problem.solutionHints?.[hintType] || problem.solutionHints?.basic || "Break the problem into input parsing, core logic, and output formatting.";
}

function fallbackReview(room, players) {
  const winner = players[0];
  const problemName = room.problem?.title || "the selected problem";
  const usedHints = players.reduce((total, player) => total + player.hintsUsed, 0);
  return `${winner.name} had the strongest race result on ${problemName}. In an interview, explain the main pattern, justify the time and space complexity, and mention the edge cases you tested. Hint usage across the match was ${usedHints}, so the final score includes fairness penalties.`;
}
