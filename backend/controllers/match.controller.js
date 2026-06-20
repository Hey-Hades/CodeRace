// backend/controllers/match.controller.js
import supabase from '../config/supabase.js';
import { calculateElo } from '../utils/eloCalculator.js';

// 1. Full V2 ELO Engine (Used by HTTP Code Execution Route)
export const declareWinner = async (roomId, winnerId, problemId, executionTimeMs) => {
    try {
        // Lock the room to prevent late submissions
        const { data: room, error: roomError } = await supabase
            .from('rooms')
            .update({ status: 'completed' })
            .eq('id', roomId)
            .eq('status', 'active') 
            .select()
            .single();

        if (roomError || !room) {
            return { success: false, message: "Match already completed." };
        }

        // Get both participants to figure out who lost
        const { data: participants } = await supabase
            .from('room_participants')
            .select('user_id')
            .eq('room_id', roomId);

        const loserId = participants.find(p => p.user_id !== winnerId)?.user_id;

        if (!loserId) {
            console.warn(`Room ${roomId} ended but no opponent was found.`);
            return { success: true }; 
        }

        // Fetch current ELOs
        const { data: users } = await supabase
            .from('users')
            .select('id, elo_rating, wins, losses, matches_played')
            .in('id', [winnerId, loserId]);

        const winnerData = users.find(u => u.id === winnerId);
        const loserData = users.find(u => u.id === loserId);

        // Calculate new ELO ratings
        const { newWinnerElo, newLoserElo, pointsExchanged } = calculateElo(winnerData.elo_rating, loserData.elo_rating);

        // Update Winner Stats
        await supabase.from('users').update({
            elo_rating: newWinnerElo,
            wins: winnerData.wins + 1,
            matches_played: winnerData.matches_played + 1
        }).eq('id', winnerId);

        // Update Loser Stats
        await supabase.from('users').update({
            elo_rating: newLoserElo,
            losses: loserData.losses + 1,
            matches_played: loserData.matches_played + 1
        }).eq('id', loserId);

        // Write to Match History
        await supabase.from('match_history').insert({
            room_id: roomId,
            problem_id: problemId,
            winner_id: winnerId,
            loser_id: loserId,
            winner_execution_time_ms: executionTimeMs
        });

        console.log(`🏆 Match Over! ${winnerId} won. ELO Exchanged: +${pointsExchanged}`);
        return { success: true, pointsExchanged, newWinnerElo };

    } catch (error) {
        console.error("Error finalizing match:", error);
        return { success: false, error: "Database transaction failed" };
    }
};

// 2. Lightweight Match Logger (Required by line 1 of socket.controller.js)
export const saveMatchToDatabase = async (roomId, matchType, difficulty, winnerId) => {
    try {
        const { data, error } = await supabase
            .from('match_history')
            .insert([
                {
                    room_id: roomId,
                    match_type: matchType,
                    difficulty: difficulty,
                    winner_id: winnerId
                }
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