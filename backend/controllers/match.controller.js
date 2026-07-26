import supabase from "../config/supabase.js";
import { calculateElo } from "../utils/eloCalculator.js";

// 1. Full V2 ELO Engine (Used by HTTP Code Execution Route)
export const declareWinner = async (
  roomId,
  winnerId,
  loserId,
  problemId,
  executionTimeMs,
) => {
  try {
    const { error } = await supabase.rpc("finalize_match", {
      p_room_id: roomId,
      p_winner_id: winnerId,
      p_loser_id: loserId,
      p_problem_id: problemId,
      p_execution_time: executionTimeMs,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("RPC Error:", error.message);
    return { success: false, error: error.message };
  }
};

// 2. Lightweight Match Logger (Required by line 1 of socket.controller.js)

export const saveMatchToDatabase = async (
  roomId,
  matchType,
  difficulty,
  winnerId,
) => {
  try {
    const { data, error } = await supabase.from("match_history").insert([
      {
        room_id: roomId,
        match_type: matchType,
        difficulty: difficulty,
        winner_id: winnerId,
      },
    ]);

    if (error) {
      console.warn("Minor history log issue, skipping log update.");
      return false;
    }
    console.log(`✅ Match history logged from socket for room: ${roomId}`);
    return true;
  } catch (error) {
    console.error("❌ Database error inside socket match save:", error.message);
    return false;
  }
};
