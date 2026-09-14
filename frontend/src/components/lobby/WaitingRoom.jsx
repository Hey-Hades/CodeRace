import React from 'react';
import PlayerCard from './PlayerCard.jsx';

const WaitingRoom = ({
  roomId,
  playerName,
  opponentName,
  amIReady,
  isOpponentReady,
  matchLabel,
  difficulty,
  copied,
  lobbyError,
  onCopy,
  onToggleReady,
  onCancel,
}) => {
  return (
    <div className="relative bg-[#080808] border border-[#1e1e1e] rounded-2xl px-4 sm:px-6 py-8 overflow-hidden">

      {/* Glow */}
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-40 h-20 bg-[#ff6b2b] blur-[60px] opacity-15 pointer-events-none" />

      {/* Room code + copy */}
      <div className="text-center mb-6 relative z-10">
        <div className="text-[10px] text-[#ff6b2b] tracking-[2px] uppercase mb-2 font-bold">Arena Ready</div>
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <div className="text-2xl sm:text-[28px] font-extrabold text-white tracking-[3px] font-mono break-all">
            {roomId}
          </div>
          <button
            onClick={onCopy}
            className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md cursor-pointer transition-all border font-inherit ${
              copied
                ? 'bg-[#4caf5022] border-[#4caf50] text-[#4caf50]'
                : 'bg-[#111] border-[#333] text-[#888] hover:border-[#555]'
            }`}
          >
            {copied ? '✓ COPIED' : 'COPY'}
          </button>
        </div>
        <div className="text-xs text-[#666] mt-2.5">
          {matchLabel} • {difficulty.toUpperCase()}
        </div>
      </div>

      <div className="border-b border-[#1e1e1e] mx-0 mb-5" />

      {lobbyError && (
        <div className="text-[#ef4743] text-sm mb-4 text-center font-semibold">{lobbyError}</div>
      )}

      {/* Player cards — side-by-side on all sizes, shrink gracefully */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center mb-6">
        <PlayerCard name={playerName || 'You'} ready={amIReady} isEmpty={false} isOpponent={false} />
        <div className="text-xs text-[#444] font-black text-center">VS</div>
        <PlayerCard name={opponentName || 'waiting...'} ready={isOpponentReady} isEmpty={!opponentName} isOpponent={true} />
      </div>

      {opponentName && (
        <button
          onClick={onToggleReady}
          className={`w-full py-3.5 rounded-lg text-sm font-bold cursor-pointer transition-all mb-4 font-inherit border-none ${
            amIReady
              ? 'bg-[#1e1e1e] text-[#aaa]'
              : 'bg-[#ff6b2b] text-white shadow-[0_4px_14px_rgba(255,107,43,0.2)] hover:bg-[#ff824d] active:scale-95'
          }`}
        >
          {amIReady ? 'Cancel Ready Status' : 'Lock In & Ready Up ⚡'}
        </button>
      )}

      <div className="text-center">
        <button
          onClick={onCancel}
          className="bg-none border-none text-[#666] text-xs cursor-pointer hover:text-white transition-colors"
        >
          ← Leave arena
        </button>
      </div>
    </div>
  );
};

export default WaitingRoom;