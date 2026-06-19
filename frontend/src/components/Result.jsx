import { useNavigate } from 'react-router-dom';

const Result = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '2rem' }}>
      <div style={{ width: '460px' }}>
        
        {/* Header section */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            Race complete
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>
            Rahul wins <span style={{ color: '#ff6b2b' }}>.</span>
          </div>
          <div style={{ fontSize: '13px', color: '#666', marginTop: '6px' }}>
            Solved in 7m 22s — no hints used
          </div>
        </div>

        <div className="divider"></div>

        {/* Player vs Player Score Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
          
          {/* Winner (Opponent) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #ff6b2b44', borderRadius: '12px', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#ff6b2b' }}></div>
            <div style={{ fontSize: '10px', color: '#ff6b2b', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>winner</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1a0f0a', border: '1px solid #ff6b2b44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#ff6b2b', margin: '0 auto 10px' }}>
              RA
            </div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Rahul</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#ff6b2b', marginTop: '8px' }}>140</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>7m 22s · 0 hints</div>
          </div>

          <div style={{ fontSize: '14px', color: '#333', fontWeight: '700', textAlign: 'center' }}>vs</div>

          {/* Loser (You) */}
          <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '12px', letterSpacing: '1px', textTransform: 'uppercase' }}>you</div>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#111', border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#555', margin: '0 auto 10px' }}>
              YO
            </div>
            <div style={{ fontSize: '14px', color: '#e8e8e8', fontWeight: '600' }}>You</div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: '#e8e8e8', marginTop: '8px' }}>75</div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>9m 10s · 1 hint</div>
          </div>
        </div>

        {/* AI Review Box */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '18px', marginBottom: '24px' }}>
          <div style={{ fontSize: '11px', color: '#ff6b2b', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px', fontWeight: '600' }}>
            AI post-match review
          </div>
          <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.9' }}>
            Both solutions use a HashMap resulting in O(n) time and O(n) space complexity. Rahul's solution avoids returning duplicate indices and handles edge cases cleaner. Your approach was correct, but the unnecessary check on line 4 adds minor overhead.
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-primary" style={{ flex: 1, padding: '14px 0' }} onClick={() => navigate('/lobby')}>
            Rematch ⚡
          </button>
          <button className="btn-ghost" style={{ flex: 1, padding: '14px 0' }} onClick={() => navigate('/')}>
            Leave room
          </button>
        </div>

      </div>
    </div>
  );
};

export default Result;