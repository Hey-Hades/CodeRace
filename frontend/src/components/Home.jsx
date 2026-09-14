import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-60px)] px-4 py-8">
      <div className="w-full max-w-[400px]">

        {/* Header Section */}
        <div className="mb-8">
          <div className="text-[11px] text-[#444] tracking-[1px] uppercase mb-2.5">
            CodeRace
          </div>
          <div className="text-2xl sm:text-[28px] font-bold text-white leading-[1.2] mb-1.5">
            Race your friends.<br />Code faster. <span className="text-[#ff6b2b]">Win.</span>
          </div>
          <div className="text-[12px] text-[#555] mt-2.5 leading-[1.8]">
            Choose your mode. Hone your skills solo or challenge an opponent in a multiplayer coding race.
          </div>
        </div>

        <div className="border-b border-[#1e1e1e] mb-5" />

        {/* Game Modes */}
        <div className="flex flex-col gap-3">

          <button
            onClick={() => navigate('/practice-lobby')}
            className="w-full p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg cursor-pointer text-left flex justify-between items-center transition-all hover:border-[#ff6b2b44] hover:bg-[#111] active:scale-[0.98]"
          >
            <div>
              <div className="text-sm font-semibold text-white">Practice Mode</div>
              <div className="text-[11px] text-[#666] mt-1">Train solo against the clock</div>
            </div>
            <span className="text-[#ff6b2b] font-bold text-lg">→</span>
          </button>

          <button
            onClick={() => navigate('/lobby')}
            className="w-full p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg cursor-pointer text-left flex justify-between items-center transition-all hover:border-[#ff6b2b44] hover:bg-[#111] active:scale-[0.98]"
          >
            <div>
              <div className="text-sm font-semibold text-white">Create / Join Race Room</div>
              <div className="text-[11px] text-[#666] mt-1">Host or join a 1v1 multiplayer race</div>
            </div>
            <span className="text-[#ff6b2b] font-bold text-lg">→</span>
          </button>

        </div>

        {/* Footer Links */}
        <div className="mt-5 flex gap-5">
          <button
            className="text-[11px] text-[#666] hover:text-white bg-transparent border-none cursor-pointer p-0 transition-colors"
            onClick={() => navigate('/leaderboard')}
          >
            View Rankings 🏆
          </button>
        </div>

      </div>
    </div>
  );
};

export default Home;