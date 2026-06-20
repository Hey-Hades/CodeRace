import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const Result = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();

  // Grab the real data passed from the Race arena
  const { didIWin = false, myProgress = 0, opponentProgress = 0 } = location.state || {};

  // Calculate final scores (Base: 20 pts per test case. Bonus: 50 pts for winning)
  const myScore = (myProgress * 20) + (didIWin ? 50 : 0);
  const opponentScore = (opponentProgress * 20) + (!didIWin ? 50 : 0);

  const handleLeaveRoom = () => {
    // If you want to cleanly disconnect or leave the socket room
    if (socket) {
      socket.emit('leave_room'); 
    }
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <div style={{ width: '460px' }}>
        
        {/* Header section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Race complete
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
            {didIWin ? 'You win ' : 'Opponent wins '}
            <span style={{ color: didIWin ? '#4caf50' : '#f44336' }}>.</span>
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
            {didIWin ? 'Flawless execution. 5/5 test cases passed.' : 'Better luck next time. Analyze the AI review below.'}
          </div>
        </div>

        <div className="divider"></div>

        {/* Dynamic Player vs Player Score Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          
          {/* Winner Box (Dynamically assigned to whoever won) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #ff6b2b44', borderRadius: '12px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#ff6b2b' }}></div>
            <div style={{ fontSize: '10px', color: '#ff6b2b', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>winner</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a0f0a', border: '1px solid #ff6b2b44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#ff6b2b', margin: '0 auto 10px' }}>
              {didIWin ? 'P1' : 'P2'}
            </div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>
              {didIWin ? 'You' : 'Opponent'}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ff6b2b', marginTop: '8px' }}>
              {didIWin ? myScore : opponentScore}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
              {didIWin ? `${myProgress}/5 passed` : `${opponentProgress}/5 passed`}
            </div>
          </div>

          <div style={{ fontSize: '14px', color: '#333', fontWeight: '700', textAlign: 'center' }}>vs</div>

          {/* Loser Box (Dynamically assigned to whoever lost) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>
              {didIWin ? 'opponent' : 'you'}
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#111', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#555', margin: '0 auto 10px' }}>
               {didIWin ? 'P2' : 'P1'}
            </div>
            <div style={{ fontSize: '14px', color: '#e8e8e8', fontWeight: '600' }}>
              {didIWin ? 'Opponent' : 'You'}
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#e8e8e8', marginTop: '8px' }}>
              {didIWin ? opponentScore : myScore}
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
              {didIWin ? `${opponentProgress}/5 passed` : `${myProgress}/5 passed`}
            </div>
          </div>
        </div>

        {/* Static AI Review Box (Can be made dynamic later with OpenAI API!) */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#ff6b2b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '600' }}>
            AI post-match review
          </div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.9' }}>
            Both solutions use a HashMap resulting in O(n) time and O(n) space complexity. The winning solution avoids returning duplicate indices and handles edge cases cleaner. 
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ flex: 1, padding: '14px 0' }} onClick={() => navigate('/')}>
            New Race ⚡
          </button>
          <button className="btn-ghost" style={{ flex: 1, padding: '14px 0' }} onClick={handleLeaveRoom}>
            Leave room
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result;