import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../utils/supabaseClient";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isLogin) {
        // --- LOGIN LOGIC ---
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        // --- SIGNUP LOGIC ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username, // Saves username to user metadata
            },
          },
        });
        if (error) throw error;
      }

      // We do NOT need to navigate manually. App.jsx will detect the session
      // change via onAuthStateChange and redirect the user automatically!
    } catch (error) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-8">
      <div className="w-[400px]">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-[11px] text-[#444] tracking-[1px] uppercase mb-2.5">
            CodeRace
          </div>
          <div className="text-[28px] font-bold text-white leading-[1.2] mb-1.5">
            {isLogin ? (
              <>
                Welcome back.
                <br />
                Login to <span className="text-[#ff6b2b]">race.</span>
              </>
            ) : (
              <>
                Join the arena.
                <br />
                Create an <span className="text-[#ff6b2b]">account.</span>
              </>
            )}
          </div>
        </div>

        <div className="border-b border-[#1e1e1e] mb-5"></div>

        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {/* Form Section */}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <label className="block text-[11px] text-[#666] mb-1.5 ml-1 font-medium">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#ff6b2b44] focus:bg-[#111] transition-all"
                placeholder="CodeNinja"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] text-[#666] mb-1.5 ml-1 font-medium">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#ff6b2b44] focus:bg-[#111] transition-all"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 ml-1">
              <label className="block text-[11px] text-[#666] font-medium">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg px-4 py-3 text-sm text-white placeholder:text-[#333] focus:outline-none focus:border-[#ff6b2b44] focus:bg-[#111] transition-all tracking-widest font-mono"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-4 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg cursor-pointer text-left flex justify-between items-center transition-all hover:border-[#ff6b2b44] hover:bg-[#111] group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div>
              <div className="text-[14px] font-semibold text-white">
                {loading
                  ? "Processing..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
              </div>
            </div>
            {!loading && (
              <span className="text-[#ff6b2b] font-bold group-hover:translate-x-1 transition-transform">
                →
              </span>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-5 flex gap-5">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg("");
            }}
            className="text-[11px] text-[#666] bg-transparent border-none cursor-pointer hover:text-white transition-colors p-0"
          >
            {isLogin
              ? "Need an account? Sign up"
              : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
