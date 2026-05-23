export const TIME_LIMIT_SECONDS = 15 * 60;

export const HINT_PENALTIES = {
  basic: 10,
  approach: 20,
  "edge-case": 15,
  optimization: 25
};

export function calculateScore({ startedAt, finishedAt, firstSolver, progress }) {
  const elapsedSeconds = Math.max(0, Math.floor((finishedAt - startedAt) / 1000));
  const timeBonus = Math.max(0, TIME_LIMIT_SECONDS - elapsedSeconds);
  const firstSolveBonus = firstSolver ? 100 : 0;
  const noHintBonus = progress.hintsUsed === 0 ? 150 : 0;
  const wrongSubmissionPenalty = Math.max(0, progress.submissions - 1) * 20;

  return Math.max(
    0,
    1000 + timeBonus + firstSolveBonus + noHintBonus - progress.hintPenalty - wrongSubmissionPenalty
  );
}
