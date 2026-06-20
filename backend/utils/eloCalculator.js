// backend/utils/eloCalculator.js

/**
 * Calculates new ELO ratings for 1v1 matches.
 * @param {number} winnerElo - Current ELO of the winner
 * @param {number} loserElo - Current ELO of the loser
 * @param {number} kFactor - Volatility multiplier (Standard is 32)
 * @returns {Object} { newWinnerElo, newLoserElo, pointsExchanged }
 */
export const calculateElo = (winnerElo, loserElo, kFactor = 32) => {
    // Calculate expected win probabilities
    const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
    const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));

    // Calculate new ratings (Winner gets 1 for win, Loser gets 0)
    let newWinnerElo = Math.round(winnerElo + kFactor * (1 - expectedWinner));
    let newLoserElo = Math.round(loserElo + kFactor * (0 - expectedLoser));

    // Prevent ELO from dropping below 0
    if (newLoserElo < 0) newLoserElo = 0;

    return {
        newWinnerElo,
        newLoserElo,
        pointsExchanged: newWinnerElo - winnerElo
    };
};