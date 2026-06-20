import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  // Lobby State
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  
  // V2 Match Configuration State
  const [difficulty, setDifficulty] = useState('Medium');
  const [matchType, setMatchType] = useState('Blitz');

  useEffect(() => {
    if (!socket) return;

    // 1. Listen for successful room creation
    socket.on('room_created', ({ roomId }) => {
      console.log('Room created successfully:', roomId);
      navigate('/lobby', { state: { roomId, isCreator: true, difficulty, matchType } });
    });

    // 2. Listen for successful room join
    socket.on('match_started', ({ roomId, difficulty, matchType }) => {
      console.log('Match started successfully:', roomId);
      navigate('/lobby', { state: { roomId, isCreator: false, difficulty, matchType } });
    });

    socket.on('room_error', ({ message }) => {
      alert(message);
    });

    return () => {
      socket.off('room_created');
      socket.off('match_started');
      socket.off('room_error');
    };
  }, [socket, navigate, difficulty, matchType]);

  const handleCreateRoom = () => {
    if (!socket) return alert('Still connecting to server...');
    
    // Emit the dynamic configuration to your backend!
    socket.emit('create_room', { 
      difficulty: difficulty.toLowerCase(), 
      matchType: matchType.toLowerCase() 
    });
  };

  const handleJoinRoom = () => {
    if (!socket) return alert('Still connecting to server...');
    if (!roomCode.trim()) return alert('Please enter a room code');
    
    socket.emit('join_room', { roomId: roomCode.trim().toUpperCase() });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <div style={{ width: '400px' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Multiplayer coding race
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', lineHeight: '1.2', marginBottom: '6px' }}>
            Race your friends.<br />Code faster. <span style={{ color: '#ff6b2b' }}>Win.</span>
          </div>
          <div style={{ fontSize: '12px', color: '#555', marginTop: '10px', lineHeight: '1.8' }}>
            Configure your match, generate a code, and challenge an opponent. First to pass all test cases takes the ELO.
          </div>
        </div>

        <div className="divider" style={{ borderBottom: '1px solid #1e1e1e', marginBottom: '20px' }}></div>

        {/* --- V2 CONFIGURATION PANEL --- */}
        <div style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Difficulty</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Easy', 'Medium', 'Hard'].map((lvl) => (
                <button 
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '6px',
                    background: difficulty === lvl ? '#1a0f0a' : '#111',
                    color: difficulty === lvl ? '#ff6b2b' : '#666',
                    border: `1px solid ${difficulty === lvl ? '#ff6b2b44' : '#222'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Time Control</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Blitz', 'Rapid', 'Custom'].map((type) => (
                <button 
                  key={type}
                  onClick={() => setMatchType(type)}
                  style={{
                    flex: 1, padding: '8px 0', fontSize: '12px', fontWeight: '600', cursor: 'pointer', borderRadius: '6px',
                    background: matchType === type ? '#1a0f0a' : '#111',
                    color: matchType === type ? '#ff6b2b' : '#666',
                    border: `1px solid ${matchType === type ? '#ff6b2b44' : '#222'}`,
                    transition: 'all 0.2s'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button className="btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }} onClick={handleCreateRoom}>
            Create race room →
          </button>
        </div>

        {/* --- JOIN ROOM PANEL --- */}
        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input 
            className="mono-input" 
            placeholder="Enter Room Code" 
            style={{ flex: 1, background: '#0a0a0a', border: '1px solid #1e1e1e', padding: '12px', color: '#fff', borderRadius: '6px', outline: 'none' }} 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button className="btn-ghost" style={{ width: 'auto', padding: '12px 18px', whiteSpace: 'nowrap' }} onClick={handleJoinRoom}>
            Join →
          </button>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
          <div style={{ fontSize: '11px', color: '#333' }}>Global Leaderboards</div>
          <div style={{ fontSize: '11px', color: '#333' }}>ELO Rated</div>
          <button className="btn-ghost" style={{ fontSize: '11px', color: '#666', padding: 0, height: 'auto', background: 'transparent' }} onClick={() => navigate('/leaderboard')}>
            View Rankings 🏆
          </button>
        </div>

      </div>
    </div>
  );
};

export default Home;