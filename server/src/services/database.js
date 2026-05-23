import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDatabaseConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

const supabase = isDatabaseConfigured
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export function getIntegrationStatus() {
  return {
    gemini: Boolean(process.env.GEMINI_API_KEY),
    judge0: Boolean(process.env.JUDGE0_URL && process.env.JUDGE0_API_KEY && process.env.JUDGE0_API_HOST),
    supabase: isDatabaseConfigured
  };
}

export async function saveSubmission({ room, player, progress, judgeResult, code, language }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("submissions")
    .insert({
      room_code: room.code,
      player_id: player.id,
      player_name: player.name,
      problem_id: room.problem.id,
      language,
      code,
      passed_tests: progress.passedTests,
      total_tests: progress.totalTests,
      status: progress.status,
      accepted: judgeResult.accepted,
      judge_source: judgeResult.source || "local",
      error: judgeResult.error || null
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase submission save error:", error.message);
    return null;
  }

  return data;
}

export async function saveHintLog({ room, player, hintType, penalty, hint }) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("ai_hints")
    .insert({
      room_code: room.code,
      player_id: player.id,
      player_name: player.name,
      problem_id: room.problem.id,
      hint_type: hintType,
      penalty,
      hint
    })
    .select("id")
    .single();

  if (error) {
    console.error("Supabase hint save error:", error.message);
    return null;
  }

  return data;
}

export async function saveMatchResult({ room, result, finishedAt }) {
  if (!supabase) return null;

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert({
      room_code: room.code,
      problem_id: room.problem.id,
      problem_title: room.problem.title,
      difficulty: room.problem.difficulty,
      status: "finished",
      winner_player_id: result.winnerId,
      winner_name: result.winnerName,
      started_at: room.startedAt ? new Date(room.startedAt).toISOString() : null,
      ended_at: new Date(finishedAt).toISOString(),
      review: result.review
    })
    .select("id")
    .single();

  if (matchError) {
    console.error("Supabase match save error:", matchError.message);
    return null;
  }

  const players = result.players.map((player) => ({
    match_id: match.id,
    player_id: player.id,
    name: player.name,
    score: player.score,
    passed_tests: player.passedTests,
    total_tests: player.totalTests,
    hints_used: player.hintsUsed,
    hint_penalty: player.hintPenalty,
    submissions: player.submissions
  }));

  const { error: playersError } = await supabase.from("match_players").insert(players);
  if (playersError) {
    console.error("Supabase match players save error:", playersError.message);
  }

  return match;
}
