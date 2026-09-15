import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore.js';
import { supabase } from '../utils/supabaseClient.js';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, user } = useUserStore();
  const [matches, setMatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error,   setError]       = useState(null);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Fetch rooms where this user participated
      const { data: participations, error: partErr } = await supabase
        .from('room_participants')
        .select(`
          room_id,
          rooms (
            id, room_code, match_type, difficulty, status, created_at,
            problem_id
          )
        `)
        .eq('user_id', user.id)
        .order('room_id', { ascending: false })
        .limit(20);

      if (partErr) throw partErr;

      // Fetch match results from match_results table if it exists
      const { data: results } = await supabase
        .from('match_results')
        .select('room_id, winner_id, loser_id, points_exchanged')
        .or(`winner_id.eq.${user.id},loser_id.eq.${user.id}`)
        .limit(20);

      const resultMap = {};
      (results || []).forEach((r) => { resultMap[r.room_id] = r; });

      const history = (participations || [])
        .filter((p) => p.rooms?.status === 'completed')
        .map((p) => {
          const room   = p.rooms;
          const result = resultMap[room.id];
          const didWin = result ? result.winner_id === user.id : null;
          return {
            roomCode:       room.room_code,
            matchType:      room.match_type,
            difficulty:     room.difficulty,
            createdAt:      room.created_at,
            didWin,
            pointsExchanged: result?.points_exchanged ?? 0,
          };
        });

      setMatches(history);
    } catch (e) {
      console.error('Profile fetch error:', e);
      setError('Could not load match history.');
    } finally {
      setLoading(false);
    }
  };

  const winRate = profile?.matches_played > 0
    ? Math.round((profile.wins / profile.matches_played) * 100)
    : 0;

  const diffColor = (d) => {
    if (!d) return '#666';
    if (d === 'easy')   return '#4caf50';
    if (d === 'medium' || d === 'med') return '#ffc107';
    if (d === 'hard')   return '#ef4743';
    return '#888';
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' });
  };

  if (!user) return null;

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-60px)] px-4 py-8">
      <div className="w-full max-w-[640px]">

        {/* ── Profile Header ─────────────────────────────── */}
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#1a1a1a] border-2 border-[#ff6b2b44] flex items-center justify-center text-2xl font-extrabold text-[#ff6b2b]">
              {profile?.username?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="text-xl font-extrabold text-white font-mono">
                @{profile?.username || user?.email?.split('@')[0]}
              </div>
              <div className="text-xs text-[#555] mt-0.5">{user?.email}</div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'ELO Rating',  value: profile?.rating       ?? '—',  accent: true },
              { label: 'Matches',     value: profile?.matches_played ?? 0 },
              { label: 'Wins',        value: profile?.wins           ?? 0,   color: '#4caf50' },
              { label: 'Win Rate',    value: `${winRate}%`,                  color: winRate >= 50 ? '#4caf50' : '#ef4743' },
            ].map(({ label, value, accent, color }) => (
              <div key={label} className="bg-[#111] border border-[#1e1e1e] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#555] uppercase tracking-wider mb-1">{label}</div>
                <div
                  className="text-xl font-extrabold font-mono"
                  style={{ color: accent ? '#ff6b2b' : color || '#fff' }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Match History ──────────────────────────────── */}
        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e1e] flex items-center justify-between">
            <span className="text-sm font-bold text-white">Match History</span>
            <span className="text-xs text-[#555]">Last 20 completed matches</span>
          </div>

          {loading && (
            <div className="px-5 py-8 text-center text-[#555] text-sm animate-pulse">
              Loading match history...
            </div>
          )}

          {error && (
            <div className="px-5 py-8 text-center text-[#ef4743] text-sm">{error}</div>
          )}

          {!loading && !error && matches.length === 0 && (
            <div className="px-5 py-10 text-center">
              <div className="text-3xl mb-3">🎮</div>
              <div className="text-[#555] text-sm">No completed matches yet.</div>
              <button
                onClick={() => navigate('/')}
                className="mt-4 text-xs text-[#ff6b2b] hover:underline bg-transparent border-none cursor-pointer"
              >
                Start your first race →
              </button>
            </div>
          )}

          {!loading && matches.map((m, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3.5 border-b border-[#111] hover:bg-[#111] transition-colors"
            >
              {/* Left: outcome + difficulty */}
              <div className="flex items-center gap-3">
                <span className="text-base">{m.didWin === true ? '🏆' : m.didWin === false ? '💀' : '—'}</span>
                <div>
                  <div className="text-sm font-semibold text-white">
                    {m.didWin === true ? 'Victory' : m.didWin === false ? 'Defeat' : 'Unrated'}
                  </div>
                  <div className="text-xs text-[#555] mt-0.5">
                    {m.matchType || 'Rapid'} &nbsp;·&nbsp;
                    <span style={{ color: diffColor(m.difficulty) }}>
                      {m.difficulty?.charAt(0).toUpperCase() + m.difficulty?.slice(1) || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: ELO change + date */}
              <div className="text-right">
                {m.didWin !== null && m.pointsExchanged > 0 && (
                  <div
                    className="text-sm font-bold font-mono"
                    style={{ color: m.didWin ? '#4caf50' : '#ef4743' }}
                  >
                    {m.didWin ? '+' : '-'}{m.pointsExchanged} ELO
                  </div>
                )}
                <div className="text-xs text-[#555] mt-0.5">{formatDate(m.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-xs text-[#555] hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            ← Back to Arena
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;
