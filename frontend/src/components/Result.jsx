import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSocket } from '../context/socketStore.js';

import MatchStats from './result/MatchStats.jsx';
import AIReview from './result/AIReview.jsx';

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  const {
    didIWin = false,
    myName = 'You',
    opponentName = 'Opponent',
    myCode = '',
    problemTitle = 'a coding challenge'
  } = location.state || {};

  const [aiFeedback, setAiFeedback] = useState("Waiting for AI analysis...");

  useEffect(() => {
    const fetchReview = async () => {
      try {
        const { data } = await axios.post('https://coderace-5xw6.onrender.com/api/ai/review', {
          code: myCode,
          problemTitle: problemTitle,
          didIWin: didIWin
        });
        setAiFeedback(data.review);
      } catch (error) {
        console.error("AI Fetch Error:", error);
        if (error.response?.data?.error) {
          setAiFeedback(`⚠️ ${error.response.data.error}`);
        } else {
          setAiFeedback("🏎️ Pit stop! The AI engines are running too hot. Try again in 60 seconds.");
        }
      }
    };

    if (myCode && myCode !== "// Waiting for problem...") {
      fetchReview();
    } else {
      setAiFeedback("No code submitted to analyze.");
    }
  }, [myCode, problemTitle, didIWin]);

  const handleNewRace = () => {
    if (socket) socket.emit('leave_room');
    navigate('/');
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-8 bg-black">
      <div className="w-full max-w-[500px]">

        <MatchStats didIWin={didIWin} opponentName={opponentName} myName={myName} />

        <div className="h-px bg-[#1e1e1e] my-6 w-full" />

        <AIReview reviewText={aiFeedback} />

        <div className="mt-6">
          <button
            onClick={handleNewRace}
            className="w-full py-4 bg-[#ff6b2b] hover:bg-[#ff824d] active:scale-[0.98] text-white border-none rounded-lg text-base font-extrabold cursor-pointer uppercase tracking-[1px] transition-all"
          >
            New Race ⚡
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result;