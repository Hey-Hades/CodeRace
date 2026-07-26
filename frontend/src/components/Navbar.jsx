import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  // Dropdown State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine if we are in practice mode to show the correct lobby name
  const isPractice = path.includes("practice") || location.state?.isPractice;
  const lobbyText = isPractice ? "Practice Lobby" : "Race Lobby";

  // Shared utility Tailwind styles to keep navigation definitions dry
  const activeClass = "text-[#ff6b2b] font-bold cursor-default select-none";
  const inactiveClass =
    "text-[#666] hover:text-white cursor-pointer transition-colors select-none";
  const dividerClass = "text-[#333] mx-3 text-xs select-none";

  return (
    <div className="flex items-center justify-between px-8 bg-[#0a0a0a] border-b border-[#1e1e1e] h-[60px]">
      {/* Top Left: Logo */}
      <div
        onClick={() => navigate("/")}
        className="text-lg font-bold text-white cursor-pointer select-none tracking-tight font-mono"
      >
        Code<span className="text-[#ff6b2b]">Race</span>..
      </div>

      {/* Top Right: Dynamic Navigation & Account Actions */}
      <div className="flex items-center text-[11px] uppercase tracking-[1px] font-semibold">
        {/* --- CORE NAV LINKS --- */}
        {(path === "/" || path === "/leaderboard" || path === "/auth") && (
          <>
            <span
              onClick={() => navigate("/")}
              className={path === "/" ? activeClass : inactiveClass}
            >
              Home
            </span>
            <span className={dividerClass}>|</span>
            <span
              onClick={() => navigate("/leaderboard")}
              className={path === "/leaderboard" ? activeClass : inactiveClass}
            >
              Leaderboard
            </span>

            <span className={dividerClass}>|</span>
          </>
        )}

        {/* --- IN-GAME CONTEXTS --- */}
        {path.includes("lobby") && (
          <>
            <span className={activeClass}>{lobbyText}</span>
            <span className={dividerClass}>|</span>
          </>
        )}

        {path === "/race" && (
          <>
            <span className={activeClass}>Race</span>
            <span className={dividerClass}>|</span>
          </>
        )}

        {path === "/result" && (
          <>
            <span className={activeClass}>Result</span>
            <span className={dividerClass}>|</span>
          </>
        )}

        {/* --- ACCOUNT AUTHENTICATION CONTEXT --- */}
        {user ? (
          <div className="relative ml-2" ref={dropdownRef}>
            {/* Profile Avatar Trigger (Standalone Circle) */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title={user.username}
              className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[#ff6b2b] font-bold text-xs hover:border-[#555] hover:bg-[#222] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff6b2b]/30 select-none"
            >
              {user.username?.charAt(0).toUpperCase() || "U"}
            </button>

            {/* Floating Dropdown Menu */}
            <div
              className={`absolute right-0 top-[calc(100%+12px)] w-48 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg shadow-2xl py-1.5 transform transition-all duration-200 origin-top-right z-50
                ${isDropdownOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}
              `}
            >
              <div className="px-4 py-2 border-b border-[#1e1e1e] mb-1">
                <p className="text-sm font-mono text-white normal-case tracking-normal truncate">
                  {user.username}
                </p>
                <p className="text-[10px] text-[#666] tracking-wider normal-case mt-0.5 truncate">
                  {user.email}
                </p>
              </div>

              <button
                onClick={() => {
                  setIsDropdownOpen(false);
                  onLogout();
                }}
                className="w-full text-left px-4 py-2.5 text-[#666] hover:text-[#ff6b2b] hover:bg-[#111] transition-colors uppercase text-[10px] tracking-wider font-semibold flex items-center gap-2 group"
              >
                <svg
                  className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  ></path>
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className={`px-3 py-1.5 bg-[#0a0a0a] border border-[#1e1e1e] rounded text-white hover:border-[#ff6b2b44] hover:bg-[#111] transition-all cursor-pointer uppercase text-[10px] font-semibold tracking-wider ml-2
              ${path === "/auth" ? "border-[#ff6b2b] text-[#ff6b2b]" : ""}
            `}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default Navbar;

