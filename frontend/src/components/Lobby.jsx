import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const Lobby = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  
  // Grab the roomId and creator status passed from the Home screen
  const roomId = location.state?.roomId || 'ERROR';
  const isCreator = location.state?.isCreator || false;

  // State for difficulty selection
  const [difficulty, setDifficulty] = useState('easy');
  
  // THE FIX: If you are NOT the creator, the creator is already in the room! 
  // So opponentJoined should start as true for Player 2.
  const [opponentJoined, setOpponentJoined] = useState(!isCreator);

  useEffect(() => {
    if (!socket) return;

    // If a user refreshes the page and loses the state, send them home
    if (roomId === 'ERROR') {
      navigate('/');
      return;
    }

    // Listen for the match starting (opponent joined)
    // This will now properly catch Player 2 joining for Player 1
    socket.on('match_started', (data) => {
      console.log('Opponent joined! Match starting...', data);
      setOpponentJoined(true);
      // Auto-update difficulty to whatever the room was set to
      if (data.difficulty) setDifficulty(data.difficulty);
    });

    return () => {
      socket.off('match_started');
    };
  }, [socket, roomId, navigate]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room code copied! Send this to your opponent.');
  };

  const handleStartRace = () => {
    if (!opponentJoined) return alert('Waiting for opponent to join...');
    navigate('/race', { state: { roomId, difficulty } });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <div style={{ width: '420px' }}>
        
        {/* Room Info Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '10px', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
            Room ready
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ fontSize: '26px', fontWeight: '700', color: '#fff', letterSpacing: '2px' }}>{roomId}</div>
            <button 
              onClick={copyRoomCode}
              className="btn-ghost"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '11px', color: '#ff6b2b', borderColor: '#1e1e1e' }}
            >
              Copy code
            </button>
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
            Share this code with your opponent
          </div>
        </div>

        <div className="divider"></div>

        {/* Player vs Player Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
          
          {/* Player 1 (You) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1a0f0a', border: '1px solid #ff6b2b33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#ff6b2b', margin: '0 auto 8px' }}>
              P1
            </div>
            <div style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: '600' }}>{isCreator ? 'You (Creator)' : 'You'}</div>
            <div style={{ fontSize: '10px', color: '#4caf50', marginTop: '4px' }}>● ready</div>
          </div>

          <div style={{ fontSize: '14px', color: '#333', fontWeight: '700', textAlign: 'center' }}>vs</div>

          {/* Player 2 (Opponent) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
            {opponentJoined ? (
              <>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#0a1a0a', border: '1px solid #4caf5033', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: '#4caf50', margin: '0 auto 8px', transition: 'all 0.3s' }}>
                  P2
                </div>
                <div style={{ fontSize: '12px', color: '#e8e8e8', fontWeight: '600' }}>Opponent</div>
                <div style={{ fontSize: '10px', color: '#4caf50', marginTop: '4px' }}>● joined</div>
              </>
            ) : (
              <>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#333', margin: '0 auto 8px' }}>
                  ?
                </div>
                <div style={{ fontSize: '12px', color: '#555' }}>waiting...</div>
                <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>○ not joined</div>
              </>
            )}
          </div>

        </div>

        {/* Difficulty Selection */}
        <div style={{ marginBottom: '20px' }}>
          <div className="section-label">Select difficulty</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => isCreator && setDifficulty('easy')}
              style={{ flex: 1, padding: '10px', background: difficulty === 'easy' ? '#0a1a0a' : '#0f0f0f', border: `1px solid ${difficulty === 'easy' ? '#2d5a2d' : '#1e1e1e'}`, borderRadius: '8px', color: difficulty === 'easy' ? '#4caf50' : '#444', fontSize: '12px', fontWeight: difficulty === 'easy' ? '600' : 'normal', cursor: isCreator ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
            >
              Easy
            </button>
            <button 
              onClick={() => isCreator && setDifficulty('med')}
              style={{ flex: 1, padding: '10px', background: difficulty === 'med' ? '#1a1000' : '#0f0f0f', border: `1px solid ${difficulty === 'med' ? '#3a2a0a' : '#1e1e1e'}`, borderRadius: '8px', color: difficulty === 'med' ? '#ff9800' : '#444', fontSize: '12px', fontWeight: difficulty === 'med' ? '600' : 'normal', cursor: isCreator ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
            >
              Medium
            </button>
            <button 
              onClick={() => isCreator && setDifficulty('hard')}
              style={{ flex: 1, padding: '10px', background: difficulty === 'hard' ? '#1a0000' : '#0f0f0f', border: `1px solid ${difficulty === 'hard' ? '#3a0a0a' : '#1e1e1e'}`, borderRadius: '8px', color: difficulty === 'hard' ? '#f44336' : '#444', fontSize: '12px', fontWeight: difficulty === 'hard' ? '600' : 'normal', cursor: isCreator ? 'pointer' : 'not-allowed', fontFamily: 'inherit', transition: 'all 0.2s' }}
            >
              Hard
            </button>
          </div>
        </div>

        {/* Action Button */}
        <button 
          className="btn-primary" 
          onClick={handleStartRace}
          style={{ opacity: opponentJoined ? 1 : 0.5, cursor: opponentJoined ? 'pointer' : 'not-allowed', transition: 'opacity 0.3s' }}
        >
          {opponentJoined ? 'Start race ⚡' : 'Waiting for opponent...'}
        </button>

      </div>
    </div>
  );
};

export default Lobby;