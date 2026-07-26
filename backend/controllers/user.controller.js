// backend/controllers/user.controller.js
import asyncHandler from "express-async-handler";
import supabase from "../config/supabase.js";

// @desc   Get top 50 players by ELO rating
// @route  GET /api/users/leaderboard
// @access Public
export const getLeaderboard = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .select("username, rating, wins, matches_played")
    .order("rating", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Supabase error:", error.message);
    res.status(500);
    throw new Error("Failed to fetch leaderboard");
  }

  res.status(200).json(data);
});

// @desc   Get specific user profile and their match history
// @route  GET /api/users/:id
// @access Public
export const getUserProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Fetch User Stats
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (userError || !user) {
    res.status(404);
    throw new Error("User not found");
  }

  // 2. Fetch their recent matches
  const { data: history } = await supabase
    .from("match_history")
    .select(
      `
            id, ended_at, winner_execution_time_ms,
            rooms ( room_code ),
            problems ( title, difficulty )
        `,
    )
    .or(`winner_id.eq.${id},loser_id.eq.${id}`)
    .order("ended_at", { ascending: false })
    .limit(10);

  res.status(200).json({
    profile: user,
    recentMatches: history || [],
  });
});

