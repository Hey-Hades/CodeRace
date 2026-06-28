import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Editor, { useMonaco } from '@monaco-editor/react';
import { useSocket } from '../context/SocketContext.jsx';
import axios from 'axios';

const Race = () => {
  const { socket } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();
  
  // --- Routing State ---
  const roomId = location.state?.roomId || 'ERROR';
  const difficulty = (location.state?.difficulty || 'medium').toLowerCase();
  const initialCompany = location.state?.company || 'All';
  const timeLimitMinutes = location.state?.timeLimit || 30; 
  const isPractice = location.state?.isPractice || false;

  // --- Core State ---
  const [problem, setProblem] = useState(null);
  const [examples, setExamples] = useState([]);
  const [constraints, setConstraints] = useState([]);
  const [companiesList, setCompaniesList] = useState([]);
  const [snippetsCache, setSnippetsCache] = useState({});

  const [hasClickedReady, setHasClickedReady] = useState(false);
  const [countdown, setCountdown] = useState(null); 
  
  // FIX: Do not start the race/timer until the problem actually loads!
  const [raceStarted, setRaceStarted] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(timeLimitMinutes * 60);

  const [myProgress, setMyProgress] = useState(0);
  const [totalCases, setTotalCases] = useState(5);
  const [opponentProgress, setOpponentProgress] = useState(0);

  // --- UI/Editor State ---
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState("// Waiting for problem...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [lastExecutionTime, setLastExecutionTime] = useState(null);

  const [leftTab, setLeftTab] = useState('description'); 
  const [bottomTab, setBottomTab] = useState('testcases'); 
  const [activeCase, setActiveCase] = useState(0);
  
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isCompaniesOpen, setIsCompaniesOpen] = useState(false);

  // --- Resizable Panes State ---
  const [leftWidth, setLeftWidth] = useState(45); 
  const [bottomHeight, setBottomHeight] = useState(35); 
  const [isDragging, setIsDragging] = useState(null); 

  // ==========================================
  // 1. MONACO THEME INJECTION
  // ==========================================
  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('codeRaceTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'ff6b2b', fontStyle: 'bold' },
        { token: 'type', foreground: '2cbb5d' },
        { token: 'string', foreground: 'e5c07b' },
        { token: 'comment', foreground: '5c6370', fontStyle: 'italic' },
      ],
      colors: {
        'editor.background': '#0a0a0a',
        'editor.lineHighlightBackground': '#161616',
        'editorLineNumber.foreground': '#444444',
        'editorIndentGuide.background': '#1e1e1e',
      }
    });
  };

  // ==========================================
  // 2. SOCKET & TIMER LISTENERS
  // ==========================================
  
  // FIX: GUARANTEED AUTO-READY FOR PRACTICE MODE
  useEffect(() => {
    if (isPractice && socket && roomId !== 'ERROR' && !hasClickedReady) {
      setHasClickedReady(true);
      
      // If we bypassed the lobby, the room doesn't exist on the server. Force create it.
      socket.emit("create_room", { 
        difficulty, 
        company: initialCompany, 
        matchType: 'practice', 
        playerName: 'Solo Player' 
      });
      
      // Give the server a tiny fraction of a second to build the room, then ready up.
      setTimeout(() => {
        socket.emit('toggle_ready', { roomId, isReady: true });
      }, 300);
    }
  }, [isPractice, socket, roomId, hasClickedReady, difficulty, initialCompany]);

  useEffect(() => {
    if (!socket) return;
    if (roomId === 'ERROR' && !isPractice) { navigate('/'); return; }

    socket.on('problem_data', (data) => {
      setProblem(data);
      if (data.examples) setExamples(typeof data.examples === 'string' ? JSON.parse(data.examples) : data.examples);
      if (data.constraints) setConstraints(typeof data.constraints === 'string' ? JSON.parse(data.constraints) : data.constraints);
      
      let parsedCompanies = [];
      if (data.companies) parsedCompanies = typeof data.companies === 'string' ? JSON.parse(data.companies) : data.companies;
      if (parsedCompanies.length === 0 && initialCompany !== 'All') parsedCompanies = [initialCompany];
      setCompaniesList(parsedCompanies);
      
      if (data.code_snippets) {
        const snippets = typeof data.code_snippets === 'string' ? JSON.parse(data.code_snippets) : data.code_snippets;
        setSnippetsCache(snippets);
        const initialLang = snippets['cpp'] ? 'cpp' : snippets['java'] ? 'java' : 'python';
        setLanguage(initialLang);
        
        const savedCode = localStorage.getItem(`coderace_${roomId}_${initialLang}`);
        setCode(savedCode || snippets[initialLang] || '// Write your code here');
      }

      // FIX: If it's practice mode, start the match immediately now that we have data
      if (isPractice) {
        setRaceStarted(true);
      }
    });

    socket.on('start_countdown', ({ seconds }) => {
      setCountdown(seconds);
      let count = seconds;
      const int = setInterval(() => {
        count -= 1;
        if (count > 0) setCountdown(count);
        else if (count === 0) setCountdown('GO!');
        else { clearInterval(int); setCountdown(null); setRaceStarted(true); }
      }, 1000);
    });

    socket.on('opponent_progress', ({ progress }) => setOpponentProgress(progress));
    
    socket.on('match_over', ({ winnerId }) => {
      navigate('/result', { state: { didIWin: winnerId === socket.id, myProgress, opponentProgress } });
    });

    // FIX: Catch Backend Errors so it doesn't fail silently
    socket.on('room_error', (data) => {
      setBottomTab('result');
      setTerminalLogs([`🚨 Server Error: ${data.message}`]);
    });

    return () => {
      socket.off('problem_data'); socket.off('start_countdown');
      socket.off('opponent_progress'); socket.off('match_over'); socket.off('room_error');
    };
  }, [socket, roomId, isPractice, navigate, initialCompany, myProgress, opponentProgress]);

  useEffect(() => {
    let timerInterval;
    if (raceStarted && timeLeft > 0) {
      timerInterval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && raceStarted) {
      setTerminalLogs(prev => [...prev, `🚨 TIME UP! Match concluded.`]);
      setIsSubmitting(true); 
    }
    return () => clearInterval(timerInterval);
  }, [raceStarted, timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ==========================================
  // 3. EDITOR ACTIONS
  // ==========================================
  const handleLanguageSelect = (newLang) => {
    setLanguage(newLang);
    setIsLangOpen(false);
    const savedCode = localStorage.getItem(`coderace_${roomId}_${newLang}`);
    setCode(savedCode || snippetsCache[newLang] || '// Write your code here');
  };

  const handleCodeChange = (val) => {
    setCode(val);
    localStorage.setItem(`coderace_${roomId}_${language}`, val);
  };

  const handleResetCode = () => {
    if (window.confirm("Reset code to original state? All changes will be lost.")) {
      const originalCode = snippetsCache[language] || '// Write your code here';
      setCode(originalCode);
      localStorage.setItem(`coderace_${roomId}_${language}`, originalCode);
    }
  };

  const handleSubmitCode = async () => {
    if (!socket || !raceStarted || isSubmitting || timeLeft === 0) return;
    setIsSubmitting(true);
    setBottomTab('result');
    setTerminalLogs(['> Initializing execution container...', '> Compiling source code...']);
    
    try {
      const { data } = await axios.post('http://localhost:5000/api/code/execute', {
        language, code, problemId: problem?.id || 'two-sum', roomId, userId: socket.id
      });

      console.log(data);
      if (data.success) {
        setTerminalLogs([`✅ Accepted`, `Execution Time: ${data.executionTimeMs}ms`, `Passed Cases: ${data.passedCount}/${data.totalCount}`]);
        setTotalCases(data.totalCount);
        if (data.passedCount > myProgress) {
          setMyProgress(data.passedCount);
          if (!isPractice) socket.emit('progress_update', { roomId, progress: data.passedCount });
        }
        setLastExecutionTime(data.executionTimeMs);
      } else {
        setTerminalLogs([`❌ Runtime Error`, data.error || data.details]);
      }
    } catch (error) {
      setTerminalLogs([`🚨 Server Error: Could not reach execution engine.`]);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 4. BULLETPROOF RESIZER LOGIC
  // ==========================================
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    if (isDragging === 'vertical') {
      const newWidth = (e.clientX / window.innerWidth) * 100;
      if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
    } else if (isDragging === 'horizontal') {
      const workspaceRect = document.getElementById('workspace-container').getBoundingClientRect();
      const relativeY = e.clientY - workspaceRect.top;
      const newHeight = ((workspaceRect.height - relativeY) / workspaceRect.height) * 100;
      if (newHeight > 10 && newHeight < 85) setBottomHeight(newHeight);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(null), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // ==========================================
  // 5. THEME, COLORS & PARSERS
  // ==========================================
  const colors = {
    bgApp: '#000000', bgPanel: '#0a0a0a', bgHeader: '#121212',
    border: '#1e1e1e', borderHover: '#ff6b2b',
    textMain: '#eff1f6', textMuted: '#6b7280',
    accent: '#ff6b2b', success: '#2cbb5d', warning: '#ffc107', fail: '#ef4743'
  };

  const getDiffStyles = (diff) => {
    if (diff === 'easy') return { color: colors.success, bg: '#2cbb5d15', border: '#2cbb5d40' };
    if (diff === 'medium' || diff === 'med') return { color: colors.warning, bg: '#ffc10715', border: '#ffc10740' };
    if (diff === 'hard') return { color: colors.fail, bg: '#ef474315', border: '#ef474340' };
    return { color: colors.textMuted, bg: '#222', border: '#333' };
  };
  const diffStyles = getDiffStyles(difficulty);

  const availableLanguages = [
    { id: 'cpp', label: 'C++' },
    { id: 'java', label: 'Java' },
    { id: 'python', label: 'Python' }
  ];

  const cleanDescription = problem?.description
    ?.replace(/Example \d+:/gi, '')
    ?.replace(/Constraints:/gi, '')
    ?.trim();

  return (
    <div style={{ boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', background: colors.bgApp, color: colors.textMain, fontFamily: "'JetBrains Mono', 'Segoe UI', sans-serif", overflow: 'hidden' }}>
      
      {isDragging && <div style={{ position: 'fixed', inset: 0, zIndex: 9999, cursor: isDragging === 'vertical' ? 'col-resize' : 'row-resize' }} />}

      {/* HANDSHAKE OVERLAY - Hides instantly if in Practice Mode */}
      {!raceStarted && !isPractice && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {countdown !== null ? (
             <div style={{ fontSize: countdown === 'GO!' ? '140px' : '180px', color: colors.accent, fontWeight: '900', textShadow: `0 0 60px ${colors.accent}66` }}>{countdown}</div>
          ) : (
             <div style={{ boxSizing: 'border-box', textAlign: 'center', width: '380px', background: colors.bgPanel, border: `1px solid ${colors.border}`, padding: '40px', borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Arena Ready</h3>
                <p style={{ fontSize: '13px', color: colors.textMuted, marginBottom: '30px', textTransform: 'uppercase', letterSpacing: '1px' }}>Waiting for both players...</p>
                {!hasClickedReady ? (
                  <button onClick={() => { setHasClickedReady(true); socket?.emit('toggle_ready', { roomId, isReady: true }); }} style={{ width: '100%', padding: '16px', background: colors.accent, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Ready Up ⚡</button>
                ) : (
                  <div style={{ padding: '16px', color: colors.accent, fontWeight: '600', animation: 'pulse 1.5s infinite', border: `1px solid ${colors.accent}44`, borderRadius: '8px', background: '#ff6b2b11' }}>Waiting for opponent...</div>
                )}
             </div>
          )}
        </div>
      )}
      
      {/* MATCH HUD */}
      <div style={{ boxSizing: 'border-box', height: '54px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: colors.bgApp, flexShrink: 0, zIndex: 50 }}>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>You</span>
            <div style={{ width: '100px', height: '4px', background: '#222', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: colors.accent, width: `${(myProgress / totalCases) * 100}%`, transition: 'width 0.3s ease' }}></div>
            </div>
            <span style={{ fontSize: '12px', color: colors.accent, fontWeight: '700' }}>{myProgress}</span>
          </div>
          
          {!isPractice && (
            <>
              <span style={{ fontSize: '12px', color: '#444', fontWeight: '900' }}>VS</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: colors.success, fontWeight: '700' }}>{opponentProgress}</span>
                <div style={{ width: '100px', height: '4px', background: '#222', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: colors.success, width: `${(opponentProgress / totalCases) * 100}%`, transition: 'width 0.3s ease' }}></div>
                </div>
                <span style={{ fontSize: '12px', color: colors.textMuted, fontWeight: '600' }}>Opponent</span>
              </div>
            </>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          {isSubmitting && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: colors.accent, animation: 'pulse 1s infinite' }} />}
          
          <button 
            disabled={!raceStarted || isSubmitting || timeLeft === 0} 
            style={{ padding: '5px 14px', fontSize: '12px', background: '#1a1a1a', color: '#e8e8e8', border: `1px solid #333`, borderRadius: '6px', cursor: !raceStarted || isSubmitting || timeLeft===0 ? 'not-allowed' : 'pointer', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} 
            onMouseOver={e => { e.currentTarget.style.background = '#2a2a2a'; e.currentTarget.style.borderColor = '#555'; }} 
            onMouseOut={e => { e.currentTarget.style.background = '#1a1a1a'; e.currentTarget.style.borderColor = '#333'; }}
          >
            <span style={{ fontSize: '10px', color: '#888' }}>▶</span> Run
          </button>

          <button 
            onClick={handleSubmitCode} 
            disabled={!raceStarted || isSubmitting || timeLeft === 0} 
            style={{ padding: '5px 16px', fontSize: '12px', background: 'rgba(44, 187, 93, 0.1)', color: colors.success, border: `1px solid rgba(44, 187, 93, 0.3)`, borderRadius: '6px', opacity: raceStarted && timeLeft > 0 ? 1 : 0.5, cursor: isSubmitting || timeLeft===0 ? 'not-allowed' : 'pointer', fontWeight: '600', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} 
            onMouseOver={e => { e.currentTarget.style.background = 'rgba(44, 187, 93, 0.2)'; e.currentTarget.style.borderColor = 'rgba(44, 187, 93, 0.6)'; }} 
            onMouseOut={e => { e.currentTarget.style.background = 'rgba(44, 187, 93, 0.1)'; e.currentTarget.style.borderColor = 'rgba(44, 187, 93, 0.3)'; }}
          >
            Submit
          </button>
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '24px' }}>
          <div style={{ 
            fontSize: '15px', fontWeight: '800', fontVariantNumeric: 'tabular-nums', letterSpacing: '1px',
            color: timeLeft <= 60 ? colors.fail : colors.textMain,
            animation: timeLeft <= 60 && timeLeft > 0 ? 'pulse 1s infinite' : 'none' 
          }}>
            {formatTime(timeLeft)}
          </div>
          <button onClick={() => {if(socket) socket.emit('leave_room', {roomId}); navigate('/');}} style={{ background: 'none', border: `1px solid ${colors.border}`, color: colors.textMuted, padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.color='#fff'} onMouseOut={e=>e.currentTarget.style.color=colors.textMuted}>Leave Match</button>
        </div>
      </div>

      {/* SPLIT PANE WORKSPACE */}
      <div id="workspace-container" style={{ boxSizing: 'border-box', display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', padding: '6px', gap: '6px' }}>
        
        {/* LEFT PANE (Problem) */}
        <div style={{ boxSizing: 'border-box', width: `${leftWidth}%`, background: colors.bgPanel, borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', background: colors.bgHeader, borderBottom: `1px solid ${colors.border}` }}>
            <button onClick={() => setLeftTab('description')} style={{ padding: '10px 16px', background: leftTab === 'description' ? colors.bgPanel : 'transparent', border: 'none', color: leftTab === 'description' ? '#fff' : colors.textMuted, borderTop: leftTab === 'description' ? `2px solid ${colors.accent}` : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Description</button>
            <button onClick={() => setLeftTab('hints')} style={{ padding: '10px 16px', background: leftTab === 'hints' ? colors.bgPanel : 'transparent', border: 'none', color: leftTab === 'hints' ? '#fff' : colors.textMuted, borderTop: leftTab === 'hints' ? `2px solid ${colors.accent}` : '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>Hints</button>
          </div>
          
          <div style={{ boxSizing: 'border-box', flex: 1, overflowY: 'auto', padding: '24px' }}>
            {!problem ? (<div style={{ color: colors.textMuted }}>Loading problem...</div>) : leftTab === 'description' ? (
              <>
                <h1 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '16px' }}>
                  {problem.leetcode_id ? `${problem.leetcode_id}. ` : ''}{problem.title}
                </h1>
                
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
                  <span style={{ fontSize: '12px', padding: '4px 12px', background: diffStyles.bg, color: diffStyles.color, border: `1px solid ${diffStyles.border}`, borderRadius: '99px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {difficulty}
                  </span>
                  
                  <div style={{ position: 'relative' }}>
                    <button 
                      onClick={() => setIsCompaniesOpen(!isCompaniesOpen)}
                      style={{ fontSize: '12px', padding: '4px 12px', background: '#161616', border: `1px solid ${colors.border}`, color: '#ccc', borderRadius: '99px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.borderColor = colors.textMuted}
                      onMouseOut={e => e.currentTarget.style.borderColor = colors.border}
                    >
                      🏢 Companies {companiesList.length > 0 ? `(${companiesList.length})` : ''}
                    </button>
                    {isCompaniesOpen && (
                      <div style={{ boxSizing: 'border-box', position: 'absolute', top: '100%', left: 0, marginTop: '8px', background: 'rgba(20, 20, 20, 0.85)', backdropFilter: 'blur(12px)', border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '16px', zIndex: 100, minWidth: '220px', boxShadow: '0 10px 40px rgba(0,0,0,0.9)' }}>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700' }}>Asked By</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {companiesList.length > 0 ? companiesList.map((comp, i) => (
                            <span key={i} style={{ background: '#2a2a2a', border: `1px solid ${colors.border}`, padding: '4px 10px', borderRadius: '4px', fontSize: '12px', color: '#fff' }}>{comp}</span>
                          )) : <span style={{ color: '#888', fontSize: '12px' }}>General Algorithm</span>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div style={{ fontSize: '14px', color: '#d4d4d4', lineHeight: '1.7', marginBottom: '32px', whiteSpace: 'pre-wrap', fontFamily: 'system-ui, sans-serif' }}>
                  {cleanDescription}
                </div>
                
                {examples.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {examples.map((ex, idx) => (
                      <div key={idx}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>Example {idx + 1}:</div>
                        <div style={{ boxSizing: 'border-box', background: '#161616', borderLeft: `3px solid ${colors.border}`, padding: '16px', fontSize: '13px', color: '#e8e8e8', whiteSpace: 'pre-wrap', borderRadius: '4px', fontFamily: "'JetBrains Mono', monospace" }}>
                          {ex.example_text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {constraints && constraints.length > 0 && (
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '12px' }}>Constraints:</div>
                    <ul style={{ paddingLeft: '20px', color: '#d4d4d4', fontSize: '13px', lineHeight: '1.8', fontFamily: "'JetBrains Mono', monospace" }}>
                      {constraints.map((c, i) => (
                        <li key={i} style={{ marginBottom: '4px' }}>
                          <code style={{ background: '#161616', padding: '2px 6px', borderRadius: '4px', border: `1px solid ${colors.border}`, color: '#e8e8e8' }}>{c}</code>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div style={{ color: colors.textMuted }}>Hints incur an ELO penalty. Use strategically.</div>
            )}
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div 
          onMouseDown={() => setIsDragging('vertical')}
          style={{ width: '4px', cursor: 'col-resize', background: 'transparent', transition: 'background 0.2s', borderRadius: '4px', zIndex: 10 }}
          onMouseOver={e => e.currentTarget.style.background = colors.borderHover}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}
        />

        {/* RIGHT PANE (Editor + Console) */}
        <div style={{ boxSizing: 'border-box', width: `calc(${100 - leftWidth}% - 10px)`, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>
          
          {/* EDITOR SECTION */}
          <div style={{ boxSizing: 'border-box', height: `calc(${100 - bottomHeight}% - 3px)`, background: colors.bgPanel, borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: colors.bgHeader, borderBottom: `1px solid ${colors.border}` }}>
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  disabled={!raceStarted}
                  style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '13px', padding: '6px 12px', borderRadius: '4px', cursor: raceStarted ? 'pointer' : 'not-allowed', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = '#222'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  {availableLanguages.find(l => l.id === language)?.label || 'C++'} <span style={{ fontSize: '9px', color: '#666' }}>▼</span>
                </button>
                {isLangOpen && raceStarted && (
                  <div style={{ boxSizing: 'border-box', position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: '#1e1e1e', border: `1px solid ${colors.border}`, borderRadius: '6px', overflow: 'hidden', zIndex: 100, minWidth: '120px', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                    {availableLanguages.map(lang => (
                      <div 
                        key={lang.id} 
                        onClick={() => handleLanguageSelect(lang.id)}
                        style={{ padding: '10px 16px', fontSize: '13px', color: '#e8e8e8', cursor: 'pointer', background: language === lang.id ? '#2a2a2a' : 'transparent', fontWeight: language === lang.id ? '700' : '500' }}
                        onMouseOver={e => e.currentTarget.style.background = '#333'}
                        onMouseOut={e => e.currentTarget.style.background = language === lang.id ? '#2a2a2a' : 'transparent'}
                      >
                        {lang.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={handleResetCode} title="Reset to original snippet" disabled={!raceStarted} style={{ background: 'transparent', border: 'none', color: colors.textMuted, cursor: raceStarted ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color='#fff'} onMouseOut={e => e.currentTarget.style.color=colors.textMuted}>
                <span style={{ fontSize: '16px' }}>↺</span> <span style={{ fontSize: '12px', fontWeight: '600' }}>Reset</span>
              </button>
            </div>
            
            <div style={{ boxSizing: 'border-box', flex: 1, padding: '8px 0' }}>
              <Editor
                height="100%" width="100%" 
                theme="codeRaceTheme"
                language={language === 'python' ? 'python' : language}
                value={code} onChange={handleCodeChange}
                beforeMount={handleEditorWillMount}
                options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontLigatures: true, scrollBeyondLastLine: false, readOnly: !raceStarted || timeLeft === 0 }}
              />
            </div>
          </div>

          {/* HORIZONTAL RESIZER */}
          <div 
            onMouseDown={() => setIsDragging('horizontal')}
            style={{ height: '4px', cursor: 'row-resize', background: 'transparent', transition: 'background 0.2s', borderRadius: '4px', zIndex: 10 }}
            onMouseOver={e => e.currentTarget.style.background = colors.borderHover}
            onMouseOut={e => e.currentTarget.style.background = 'transparent'}
          />

          {/* CONSOLE SECTION */}
          <div style={{ boxSizing: 'border-box', height: `calc(${bottomHeight}% - 3px)`, background: colors.bgPanel, borderRadius: '8px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            <div style={{ boxSizing: 'border-box', display: 'flex', background: colors.bgHeader, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
              <button onClick={() => setBottomTab('testcases')} style={{ padding: '8px 20px', background: bottomTab === 'testcases' ? colors.bgPanel : 'transparent', border: 'none', color: bottomTab === 'testcases' ? '#fff' : colors.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: '600', borderTop: bottomTab === 'testcases' ? `2px solid ${colors.accent}` : '2px solid transparent' }}>Testcase</button>
              <button onClick={() => setBottomTab('result')} style={{ padding: '8px 20px', background: bottomTab === 'result' ? colors.bgPanel : 'transparent', border: 'none', color: bottomTab === 'result' ? '#fff' : colors.textMuted, cursor: 'pointer', fontSize: '13px', fontWeight: '600', borderTop: bottomTab === 'result' ? `2px solid ${colors.accent}` : '2px solid transparent' }}>Test Result</button>
            </div>

            <div style={{ boxSizing: 'border-box', flex: 1, padding: '16px', overflowY: 'auto' }}>
              {bottomTab === 'testcases' && (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    {examples.map((_, i) => (
                      <button key={i} onClick={() => setActiveCase(i)} style={{ fontSize: '12px', padding: '6px 16px', background: activeCase === i ? '#333' : '#1a1a1a', border: 'none', borderRadius: '6px', color: activeCase === i ? '#fff' : colors.textMuted, cursor: 'pointer', fontWeight: '600', transition: 'background 0.2s' }}>Case {i + 1}</button>
                    ))}
                  </div>
                  {examples[activeCase] && (
                    <div style={{ boxSizing: 'border-box', background: '#161616', padding: '12px', borderRadius: '6px', border: `1px solid ${colors.border}`, fontFamily: 'monospace', fontSize: '13px', color: '#e8e8e8', whiteSpace: 'pre-wrap' }}>
                      {examples[activeCase].example_text.split('\n')[0].replace('Input: ', '')}
                    </div>
                  )}
                </div>
              )}
              {bottomTab === 'result' && (
                <div style={{ fontFamily: 'monospace', fontSize: '13px' }}>
                  {terminalLogs.length === 0 ? <span style={{color: colors.textMuted}}>You must run your code first.</span> : 
                    <>
                      {terminalLogs[0].includes('✅') && <div style={{ fontSize: '20px', color: colors.success, fontWeight: 'bold', marginBottom: '12px' }}>Accepted</div>}
                      {terminalLogs[0].includes('❌') && <div style={{ fontSize: '20px', color: colors.fail, fontWeight: 'bold', marginBottom: '12px' }}>Runtime Error</div>}
                      {terminalLogs.map((log, idx) => (
                        <div key={idx} style={{ boxSizing: 'border-box', color: log.includes('❌') || log.includes('🚨') ? colors.fail : log.includes('✅') ? colors.success : '#ccc', padding: '10px', background: '#161616', borderRadius: '6px', border: `1px solid ${colors.border}`, marginBottom: '8px', whiteSpace: 'pre-wrap' }}>{log}</div>
                      ))}
                    </>
                  }
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Race;
