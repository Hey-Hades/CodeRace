import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./components/Home.jsx";
import Lobby from "./components/Lobby.jsx";
import Race from "./components/Race.jsx";
import Result from "./components/Result.jsx";
import Leaderboard from "./components/Leaderboard.jsx";
import Navbar from "./components/Navbar.jsx";
import Auth from "./components/AuthPage.jsx";
import { useEffect } from "react";
import { useUserStore } from "./store/useUserStore.js";
import { supabase } from "./utils/supabaseClient.js";
import "./App.css";

function App() {
  const {
    user,
    profile,
    setUser,
    setAuthLoading,
    setProfile,
    clearUser,
    isAuthLoading,
  } = useUserStore();

  const fetchProfile = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data);
  };

  useEffect(() => {
    let mounted = true;

    // 1. Initial Check
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        clearUser();
      }
      if (mounted) setAuthLoading(false);
    };

    checkSession();

    // 2. Listen for log in / log out
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        clearUser();
      }
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 🛑 THE GATEKEEPER: Halts the app until Zustand has the data
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1e1e1e] border-t-[#ff6b2b] rounded-full animate-spin"></div>
          <p className="text-[#6b7280] font-medium tracking-wide">
            Loading environment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-[#ff6b2b]/30 flex flex-col">
        <Navbar user={profile} onLogout={handleLogout} />
        <div className="flex-1 w-full flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/auth"
              element={user ? <Navigate to="/" /> : <Auth />}
            />
            <Route path="/lobby" element={<Lobby />} />
            <Route path="/practice-lobby" element={<Lobby />} />
            <Route path="/race" element={<Race />} />
            <Route path="/result" element={<Result />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
