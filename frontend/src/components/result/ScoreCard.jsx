import React from 'react';

const ScoreCard = ({ didIWin, myScore, opponentScore, myProgress, opponentProgress }) => {
  return (
    /* Stack vertically on mobile, side-by-side (3-col grid) on sm+ */
    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 sm:gap-5 items-stretch mb-6">

      {/* Winner Box */}
      <div className="relative flex flex-col justify-center bg-[#0a0a0a] border border-[#ff6b2b44] rounded-xl px-4 py-6 text-center overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#ff6b2b]" />
        <div className="text-[10px] text-[#ff6b2b] mb-3 tracking-[1px] uppercase font-bold">winner</div>
        <div className="w-11 h-11 rounded-full bg-[#1a0f0a] border border-[#ff6b2b44] flex items-center justify-center text-sm font-extrabold text-[#ff6b2b] mx-auto mb-3">
          {didIWin ? 'P1' : 'P2'}
        </div>
        <div className="text-sm text-white font-semibold">{didIWin ? 'You' : 'Opponent'}</div>
        <div className="text-3xl sm:text-[36px] font-extrabold text-[#ff6b2b] mt-2">
          {didIWin ? myScore : opponentScore}
        </div>
        <div className="text-xs text-[#666] mt-1.5 font-medium">
          {didIWin ? `${myProgress}/5 passed` : `${opponentProgress}/5 passed`}
        </div>
      </div>

      {/* VS Badge — horizontal divider on mobile, vertical badge on sm+ */}
      <div className="flex items-center justify-center">
        <div className="sm:hidden w-full h-px bg-[#1e1e1e]" />
        <div className="hidden sm:flex items-center justify-center text-xs text-[#444] font-extrabold bg-[#111] px-2.5 py-1.5 rounded-md uppercase">
          vs
        </div>
      </div>

      {/* Loser Box */}
      <div className="flex flex-col justify-center bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-4 py-6 text-center">
        <div className="text-[10px] text-[#555] mb-3 tracking-[1px] uppercase font-bold">
          {didIWin ? 'opponent' : 'you'}
        </div>
        <div className="w-11 h-11 rounded-full bg-[#111] border border-[#1e1e1e] flex items-center justify-center text-sm font-extrabold text-[#555] mx-auto mb-3">
          {didIWin ? 'P2' : 'P1'}
        </div>
        <div className="text-sm text-[#e8e8e8] font-semibold">{didIWin ? 'Opponent' : 'You'}</div>
        <div className="text-3xl sm:text-[36px] font-extrabold text-[#e8e8e8] mt-2">
          {didIWin ? opponentScore : myScore}
        </div>
        <div className="text-xs text-[#555] mt-1.5 font-medium">
          {didIWin ? `${opponentProgress}/5 passed` : `${myProgress}/5 passed`}
        </div>
      </div>

    </div>
  );
};

export default ScoreCard;