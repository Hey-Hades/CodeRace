import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext.jsx';

const Race = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  const roomId = location.state?.roomId || 'ERROR';
  const difficulty = location.state?.difficulty || 'medium';
  const matchType = location.state?.matchType || '1v1';

  // --- Handshake & Race State ---
  const [hasClickedReady, setHasClickedReady] = useState(false);
  const [countdown, setCountdown] = useState(null); 
  const [raceStarted, setRaceStarted] = useState(false);

  // --- Real-time Match State ---
  const [myProgress, setMyProgress] = useState(0);
  const [opponentProgress, setOpponentProgress] = useState(0);

  // --- Code Execution State ---
  const [code, setCode] = useState("function twoSum(nums, target) {\n  // Write your code here\n}");
  const [language, setLanguage] = useState('javascript');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- UI State ---
  const [leftTab, setLeftTab] = useState('problem'); 
  const [bottomTab, setBottomTab] = useState('tc'); 
  const [activeCase, setActiveCase] = useState(0);
  const [activeHint, setActiveHint] = useState(null);

  const hints = [
    "Think about what you need for each element — if you're at nums[i], what single value completes the pair?",
    "Use a HashMap. Store each number as you go. For each element, check if its complement already exists in the map.",
    "Edge case: what if the same number appears twice? e.g. [3,3] with target 6. Don't reuse the same index.",
    "Current approach is O(n²). HashMap gives O(n) time and O(n) space — store value→index as you iterate."
  ];

  useEffect(() => {
    if (!socket) return;
    if (roomId === 'ERROR') {
      navigate('/');
      return;
    }

    // 1. Listen for the Countdown Signal once BOTH players click ready
    socket.on('start_countdown', ({ seconds }) => {
      setCountdown(seconds);
      let count = seconds;
      
      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else if (count === 0) {
          setCountdown('GO!');
        } else {
          clearInterval(interval);
          setCountdown(null);
          setRaceStarted(true); // Unlock the editor!
        }
      }, 1000);
    });

    // 2. Listen for progress updates & match over events
    socket.on('opponent_progress', ({ progress }) => {
      setOpponentProgress(progress);
    });

    socket.on('match_over', ({ winnerId }) => {
      const didIWin = winnerId === socket.id;
      navigate('/result', { state: { didIWin, myProgress, opponentProgress } });
    });

    // Handle case where opponent leaves during the handshake screen
    socket.on('opponent_left_handshake', () => {
      alert("Opponent left the match preparation screen.");
      setHasClickedReady(false);
      setCountdown(null);
    });

    return () => {
      socket.off('start_countdown');
      socket.off('opponent_progress');
      socket.off('match_over');
      socket.off('opponent_left_handshake');
    };
  }, [socket, roomId, navigate, myProgress, opponentProgress]);

  // --- MANUAL CLICK HANDSHAKE LOGIC ---
  const handleReadyClick = () => {
    if (!socket) return;
    setHasClickedReady(true);
    // Tell the backend that THIS specific user is locked and ready
    socket.emit('player_ready', { roomId });
  };

  // --- REAL CODE SUBMISSION LOGIC ---
  const handleSubmitCode = async () => {
    if (!socket || !raceStarted || isSubmitting) return;
    
    setIsSubmitting(true);
    setBottomTab('res'); 
    
    try {
      const response = await fetch('http://localhost:5000/api/code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: language, 
          code: code,
          problemId: 'two-sum',
          roomId: roomId,
          userId: socket.id
        })
      });

      const result = await response.json();
      
      if (result.success && result.passedCount >= 0) {
        if (result.passedCount > myProgress) {
          setMyProgress(result.passedCount);
          socket.emit('progress_update', { roomId, progress: result.passedCount });
          
          if (result.allPassed) {
            socket.emit('player_won', { roomId });
          }
        }
      } else {
        console.log("Execution failed or errors occurred:", result.error || result.details);
      }
    } catch (error) {
      console.error("Execution error:", error);
      alert("Failed to run code on server. Is the backend running?");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, width: '100%', background: '#0a0a0a', overflow: 'hidden', position: 'relative' }}>
      
      {/* THE MUTUAL READINESS & COUNTDOWN OVERLAY */}
      {!raceStarted && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(10, 10, 10, 0.94)', backdropFilter: 'blur(8px)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {countdown !== null ? (
             <div style={{ fontSize: countdown === 'GO!' ? '140px' : '180px', color: '#ff6b2b', fontWeight: '800', textShadow: '0 0 60px rgba(255, 107, 43, 0.5)', letterSpacing: '-2px' }}>
               {countdown}
             </div>
          ) : (
             <div style={{ textAlign: 'center', width: '340px' }}>
                <h3 style={{ fontSize: '22px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Arena Initialized</h3>
                <p style={{ fontSize: '12px', color: '#555', marginBottom: '24px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  {matchType} // Difficulty: {difficulty}
                </p>
                
                {!hasClickedReady ? (
                  <button className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '14px' }} onClick={handleReadyClick}>
                    Ready to Race ⚡
                  </button>
                ) : (
                  <div style={{ padding: '14px', background: '#0f0f0f', border: '1px solid #ff6b2b33', borderRadius: '8px', color: '#ff6b2b', fontSize: '13px', fontWeight: '600', animation: 'pulse 1.5s infinite opacity' }}>
                    Waiting for other player to start...
                  </div>
                )}
             </div>
          )}
        </div>
      )}
      
      {/* --- RACE NAV --- */}
      <div style={{ padding: '10px 24px', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '24px', background: '#0a0a0a', flexShrink: 0 }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', minWidth: '120px' }}>
          Code<span style={{ color: '#ff6b2b' }}>Race</span> ..
        </div>
        
        {/* LIVE PROGRESS BARS */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#555', minWidth: '30px', textAlign: 'right' }}>You</span>
          <div className="pbar-bg" style={{ maxWidth: '400px', width: '100%', background: '#161616', height: '4px', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#ff6b2b', width: `${(myProgress / 5) * 100}%`, transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '12px', color: '#ff6b2b', fontWeight: '600' }}>{myProgress}/5</span>
          
          <span style={{ fontSize: '12px', color: '#444', margin: '0 12px', fontWeight: '700' }}>VS</span>
          
          <span style={{ fontSize: '12px', color: '#4caf50', fontWeight: '600' }}>{opponentProgress}/5</span>
          <div className="pbar-bg" style={{ maxWidth: '400px', width: '100%', background: '#161616', height: '4px', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: '#4caf50', width: `${(opponentProgress / 5) * 100}%`, transition: 'width 0.3s ease' }}></div>
          </div>
          <span style={{ fontSize: '12px', color: '#555', minWidth: '40px' }}>Opponent</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontSize: '16px', color: '#f44336', fontWeight: '700', fontVariantNumeric: 'tabular-nums', letterSpacing: '1px' }}>12:33</div>
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '6px', color: '#e8e8e8', fontSize: '12px', padding: '6px 12px', fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }} 
            disabled={!raceStarted}
          >
            <option value="javascript">javascript</option>
            <option value="python">python</option>
            <option value="cpp">cpp</option>
            <option value="java">java</option>
          </select>
        </div>
      </div>

      {/* --- MAIN ARENA --- */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        
        {/* LEFT PANEL */}
        <div style={{ flex: '0 0 300px', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
          <div className="tabs">
            <button className={`tab ${leftTab === 'problem' ? 'active' : ''}`} onClick={() => setLeftTab('problem')} style={{ flex: 1 }}>Problem</button>
            <button className={`tab ${leftTab === 'hints' ? 'active' : ''}`} onClick={() => setLeftTab('hints')} style={{ flex: 1 }}>AI hints</button>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px' }}>
            {leftTab === 'problem' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>Two Sum</span>
                  <span className={`pill ${difficulty.toLowerCase()}`}>{difficulty}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#999', lineHeight: '1.8', marginBottom: '20px' }}>
                  Given array <span style={{ color: '#ff6b2b' }}>nums</span> and integer <span style={{ color: '#ff6b2b' }}>target</span>, return indices of two numbers that add up to target. Exactly one solution exists.
                </div>
                <div className="section-label">Example</div>
                <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '14px', fontSize: '13px', lineHeight: '1.9', marginBottom: '14px' }}>
                  <div style={{ marginBottom: '6px' }}><span style={{ color: '#555', display: 'inline-block', width: '60px' }}>Input</span><span style={{ color: '#e8e8e8' }}>nums=[2,7,11,15], target=9</span></div>
                  <div><span style={{ color: '#555', display: 'inline-block', width: '60px' }}>Output</span><span style={{ color: '#4caf50' }}>[0,1]</span></div>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '16px', lineHeight: '1.7' }}>Each hint reduces your score. Use strategically.</div>
                {hints.map((hint, i) => (
                  <div key={i} className="hint-row" onClick={() => setActiveHint(i)} style={{ padding: '12px', background: activeHint === i ? '#161616' : 'transparent', marginBottom: '8px', borderRadius: '6px', border: `1px solid ${activeHint === i ? '#ff6b2b44' : '#1e1e1e'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#e8e8e8' }}>Hint {i + 1}</span>
                      <span style={{ fontSize: '12px', color: '#f44336' }}>-10 pts</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* MIDDLE PANEL */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ flex: 1, minHeight: 0, background: '#080808', overflow: 'hidden' }}>
            <Editor
              height="100%"
              width="100%"
              theme="vs-dark"
              language={language}
              value={code}
              onChange={(value) => setCode(value)}
              options={{ 
                minimap: { enabled: false }, 
                fontSize: 16, 
                fontFamily: 'JetBrains Mono', 
                padding: { top: 20 }, 
                scrollbar: { vertical: 'hidden', horizontal: 'hidden' }, 
                overviewRulerBorder: false, 
                hideCursorInOverviewRuler: true,
                readOnly: !raceStarted 
              }}
            />
          </div>

          <div style={{ height: '220px', flexShrink: 0, borderTop: '1px solid #1e1e1e', background: '#0a0a0a', display: 'flex', flexDirection: 'column' }}>
            <div className="tabs">
              <button className={`tab ${bottomTab === 'tc' ? 'active' : ''}`} onClick={() => setBottomTab('tc')}>Test cases</button>
              <button className={`tab ${bottomTab === 'res' ? 'active' : ''}`} onClick={() => setBottomTab('res')}>Results</button>
              <button className={`tab ${bottomTab === 'con' ? 'active' : ''}`} onClick={() => setBottomTab('con')}>Console</button>
            </div>

            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {bottomTab === 'tc' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    {[0, 1, 2].map((i) => (
                      <button key={i} onClick={() => setActiveCase(i)} style={{ fontSize: '12px', padding: '6px 16px', background: activeCase === i ? '#1a0f0a' : '#0f0f0f', border: `1px solid ${activeCase === i ? '#ff6b2b44' : '#1e1e1e'}`, borderRadius: '6px', color: activeCase === i ? '#ff6b2b' : '#666', cursor: 'pointer' }}>
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}><span style={{ fontSize: '13px', color: '#555' }}>nums =</span><span style={{ fontSize: '13px', color: '#e8e8e8', background: '#0f0f0f', border: '1px solid #1e1e1e', padding: '8px 12px', borderRadius: '6px', width: '100%', fontFamily: 'monospace' }}>[2, 7, 11, 15]</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}><span style={{ fontSize: '13px', color: '#555' }}>target =</span><span style={{ fontSize: '13px', color: '#e8e8e8', background: '#0f0f0f', border: '1px solid #1e1e1e', padding: '8px 12px', borderRadius: '6px', width: '100%', fontFamily: 'monospace' }}>9</span></div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
                    <button className="btn-sm" style={{ flex: 1, padding: '12px 0', fontSize: '13px', opacity: raceStarted ? 1 : 0.5 }} disabled={!raceStarted} onClick={() => setBottomTab('res')}>Run Code</button>
                    <button className="btn-sm orange" style={{ flex: 1, padding: '12px 0', fontSize: '13px', opacity: raceStarted ? 1 : 0.5 }} disabled={!raceStarted || isSubmitting} onClick={handleSubmitCode}>
                      {isSubmitting ? 'Running...' : 'Submit ⚡'}
                    </button>
                  </div>
                </div>
              )}
              {bottomTab === 'res' && (
                <div>
                  <div style={{ fontSize: '13px', color: myProgress === 5 ? '#4caf50' : '#ff9800', fontWeight: '600', marginBottom: '8px' }}>{myProgress} / 5 passed</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Check backend logs or console for detailed execution outputs!</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ flex: '0 0 220px', borderLeft: '1px solid #1e1e1e', padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#0a0a0a' }}>
          <div>
            <div className="section-label">Live score</div>
            <div style={{ background: '#0f0f0f', border: '1px solid #1a0f0a', borderRadius: '10px', padding: '16px', textAlign: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px', color: '#ff6b2b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>You</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{(myProgress * 20) || 0}</div>
            </div>
            <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>Opponent</div>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#fff' }}>{(opponentProgress * 20) || 0}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Race;