import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const Home = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    // If socket isn't loaded yet, do nothing
    if (!socket) return;

    // 1. Listen for successful room creation (MATCHED TO BACKEND)
    socket.on('room_created', ({ roomId }) => {
      console.log('Room created successfully:', roomId);
      // Navigate to the lobby and pass the roomId and creator status in the route state
      navigate('/lobby', { state: { roomId, isCreator: true } });
    });

    // 2. Listen for successful room join (Backend uses match_started)
    socket.on('match_started', ({ roomId, difficulty, matchType }) => {
      console.log('Match started successfully:', roomId);
      navigate('/lobby', { state: { roomId, isCreator: false } });
    });

    // 3. Listen for backend errors
    socket.on('room_error', ({ message }) => {
      alert(message);
    });

    // Cleanup listeners when you leave the screen
    return () => {
      socket.off('room_created');
      socket.off('match_started');
      socket.off('room_error');
    };
  }, [socket, navigate]);

  const handleCreateRoom = () => {
    if (!socket) return alert('Still connecting to server...');
    
    // Emit the EXACT event your backend expects
    socket.emit('create_room', { difficulty: 'easy', matchType: '1v1' });
  };

  const handleJoinRoom = () => {
    if (!socket) return alert('Still connecting to server...');
    if (!roomCode.trim()) return alert('Please enter a room code');
    
    // Emit the EXACT event your backend expects
    socket.emit('join_room', { roomId: roomCode.trim().toUpperCase() });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <div style={{ width: '380px' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>
            Multiplayer coding race
          </div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#fff', lineHeight: '1.2', marginBottom: '6px' }}>
            Race your friends.<br />Code faster. <span style={{ color: '#ff6b2b' }}>Win.</span>
          </div>
          <div style={{ fontSize: '12px', color: '#444', marginTop: '10px', lineHeight: '1.8' }}>
            Two players. One problem. First correct solution wins.<br />No accounts. No setup. Just a room code.
          </div>
        </div>

        <div className="divider"></div>

        <div style={{ marginBottom: '12px' }}>
          <input className="mono-input" placeholder="Enter your name (Optional for now)" style={{ marginBottom: '10px' }} />
          <button className="btn-primary" onClick={handleCreateRoom}>
            Create race room →
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
          <input 
            className="mono-input" 
            placeholder="Room code" 
            style={{ flex: 1 }} 
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <button className="btn-ghost" style={{ width: 'auto', padding: '12px 18px', whiteSpace: 'nowrap' }} onClick={handleJoinRoom}>
            Join →
          </button>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
          <div style={{ fontSize: '11px', color: '#333' }}>No signup required</div>
          <div style={{ fontSize: '11px', color: '#333' }}>Free to use</div>
          <div style={{ fontSize: '11px', color: '#333' }}>Open source</div>
        </div>

      </div>
    </div>
  );
};

export default Home;