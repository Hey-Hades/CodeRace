import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/socketStore.js';

import MatchStats from './result/MatchStats.jsx';
import AIReview from './result/AIReview.jsx';

const LANG_LABEL = { cpp: 'C++', python: 'Python', java: 'Java', javascript: 'JavaScript' };

const Result = () => {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { socket } = useSocket();

  const {
    didIWin       = false,
    myName        = 'You',
    opponentName  = 'Opponent',
    myCode        = '',
    problemTitle  = 'a coding challenge',
    difficulty    = 'medium',
    matchType     = '',
    isPractice    = false,
    winnerCode    = '',
    winnerLanguage = 'cpp',
  } = location.state || {};

  const [aiFeedback, setAiFeedback]   = useState('Waiting for AI analysis...');
  const [showSolution, setShowSolution] = useState(false);

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await axios.post('https://coderace-5xw6.onrender.com/api/ai/review', {
          code: myCode,
          problemTitle,
          didIWin,
        });
        setAiFeedback(data.review);
      } catch (error) {
        if (error.response?.data?.error) {
          setAiFeedback(`⚠️ ${error.response.data.error}`);
        } else {
          setAiFeedback('🏎️ Pit stop! The AI engines are running too hot. Try again in 60 seconds.');
        }
      }
    };

    if (myCode && myCode !== '// Waiting for problem...') {
      fetchReview();
    } else {
      setAiFeedback('No code submitted to analyze.');
    }
  }, [myCode, problemTitle, didIWin]);

  const handleNewRace = () => {
    if (socket) socket.emit('leave_room');
    navigate('/');
  };

  // Feature 4: Rematch — go back to lobby with same settings pre-filled
  const handleRematch = () => {
    if (socket) socket.emit('leave_room');
    navigate('/lobby', {
      state: { prefillDifficulty: difficulty, prefillMatchType: matchType },
    });
  };

  const hasWinnerCode = winnerCode && winnerCode.trim().length > 0;
  const winnerName    = didIWin ? myName : opponentName;

  return (
    <div className="flex items-start justify-center min-h-[calc(100vh-60px)] px-4 py-8 pb-12 bg-black">
      <div className="w-full max-w-[560px]">

        {/* Match outcome */}
        <MatchStats didIWin={didIWin} opponentName={opponentName} myName={myName} />

        <div className="h-px bg-[#1e1e1e] my-5 w-full" />

        {/* AI Review */}
        <AIReview reviewText={aiFeedback} />

        {/* Feature 2: Winning Solution */}
        {hasWinnerCode && (
          <div className="mb-5">
            <button
              onClick={() => setShowSolution(!showSolution)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#0f0f0f] border border-[#1e1e1e] hover:border-[#333] rounded-lg cursor-pointer transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#ff6b2b] uppercase tracking-wider">
                  🏆 Winning Solution
                </span>
                <span className="text-xs text-[#555]">
                  by {winnerName} · {LANG_LABEL[winnerLanguage] || winnerLanguage}
                </span>
              </div>
              <span className="text-[#555] text-xs font-mono">
                {showSolution ? '▲ hide' : '▼ show'}
              </span>
            </button>

            {showSolution && (
              <div className="border border-[#1e1e1e] border-t-0 rounded-b-lg overflow-hidden">
                <pre className="bg-[#0a0a0a] p-4 text-xs text-neutral-300 overflow-x-auto max-w-full leading-relaxed font-mono whitespace-pre">
                  {winnerCode}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Feature 4: Buttons — Rematch + New Race */}
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {!isPractice && (
            <button
              onClick={handleRematch}
              className="flex-1 py-3.5 bg-[#111] hover:bg-[#1a1a1a] active:scale-[0.98] text-white border border-[#333] hover:border-[#555] rounded-lg text-sm font-bold cursor-pointer uppercase tracking-[1px] transition-all"
            >
              Rematch 🔄
            </button>
          )}
          <button
            onClick={handleNewRace}
            className="flex-1 py-3.5 bg-[#ff6b2b] hover:bg-[#ff824d] active:scale-[0.98] text-white border-none rounded-lg text-sm font-extrabold cursor-pointer uppercase tracking-[1px] transition-all"
          >
            New Race ⚡
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result;