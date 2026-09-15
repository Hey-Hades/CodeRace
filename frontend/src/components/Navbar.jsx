import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [path]);

  const isPractice = path.includes("practice") || location.state?.isPractice;
  const lobbyText = isPractice ? "Practice Lobby" : "Race Lobby";

  const activeClass = "text-[#ff6b2b] font-bold cursor-default select-none";
  const inactiveClass = "text-[#666] hover:text-white cursor-pointer transition-colors select-none";
  const dividerClass = "text-[#333] mx-3 text-xs select-none hidden md:inline";

  // Determine current context label for mobile breadcrumb
  const getContextLabel = () => {
    if (path.includes("lobby")) return lobbyText;
    if (path === "/race") return "Race";
    if (path === "/result") return "Result";
    return null;
  };
  const contextLabel = getContextLabel();

  return (
    <div className="flex items-center justify-between px-4 sm:px-8 bg-[#0a0a0a] border-b border-[#1e1e1e] h-[60px] relative z-50">

      {/* Logo */}
      <div
        onClick={() => navigate("/")}
        className="text-lg font-bold text-white cursor-pointer select-none tracking-tight font-mono shrink-0"
      >
        Code<span className="text-[#ff6b2b]">Race</span>..
      </div>

      {/* Center: context breadcrumb on mobile (race/lobby/result pages) */}
      {contextLabel && (
        <span className="md:hidden text-[11px] uppercase tracking-[1px] font-semibold text-[#ff6b2b] absolute left-1/2 -translate-x-1/2">
          {contextLabel}
        </span>
      )}

      {/* Desktop Nav Links */}
      <div className="hidden md:flex items-center text-[11px] uppercase tracking-[1px] font-semibold">
        {(path === "/" || path === "/leaderboard" || path === "/auth") && (
          <>
            <span onClick={() => navigate("/")} className={path === "/" ? activeClass : inactiveClass}>Home</span>
            <span className={dividerClass}>|</span>
            <span onClick={() => navigate("/leaderboard")} className={path === "/leaderboard" ? activeClass : inactiveClass}>Leaderboard</span>
            <span className={dividerClass}>|</span>
          </>
        )}
        {path.includes("lobby") && <><span className={activeClass}>{lobbyText}</span><span className={dividerClass}>|</span></>}
        {path === "/race" && <><span className={activeClass}>Race</span><span className={dividerClass}>|</span></>}
        {path === "/result" && <><span className={activeClass}>Result</span><span className={dividerClass}>|</span></>}

        {/* Auth (desktop) */}
        {user ? (
          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title={user.username}
              className="w-8 h-8 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[#ff6b2b] font-bold text-xs hover:border-[#555] hover:bg-[#222] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff6b2b]/30 select-none"
            >
              {user.username?.charAt(0).toUpperCase() || "U"}
            </button>
            <div className={`absolute right-0 top-[calc(100%+12px)] w-48 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg shadow-2xl py-1.5 transform transition-all duration-200 origin-top-right z-50 ${isDropdownOpen ? "opacity-100 scale-100 translate-y-0 pointer-events-auto" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
              <div className="px-4 py-2 border-b border-[#1e1e1e] mb-1">
                <p className="text-sm font-mono text-white normal-case tracking-normal truncate">{user.username}</p>
                <p className="text-[10px] text-[#666] tracking-wider normal-case mt-0.5 truncate">{user.email}</p>
              </div>
              <button onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-white hover:bg-[#111] transition-colors uppercase text-[10px] tracking-wider font-semibold flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                View Profile
              </button>
              <button onClick={() => { setIsDropdownOpen(false); onLogout(); }} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-[#ff6b2b] hover:bg-[#111] transition-colors uppercase text-[10px] tracking-wider font-semibold flex items-center gap-2">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <button onClick={() => navigate("/auth")} className={`px-3 py-1.5 bg-[#0a0a0a] border border-[#1e1e1e] rounded text-white hover:border-[#ff6b2b44] hover:bg-[#111] transition-all cursor-pointer uppercase text-[10px] font-semibold tracking-wider ml-2 ${path === "/auth" ? "border-[#ff6b2b] text-[#ff6b2b]" : ""}`}>
            Sign In
          </button>
        )}
      </div>

      {/* Mobile right: auth avatar + hamburger */}
      <div className="md:hidden flex items-center gap-2">
        {/* Avatar (always visible on mobile if logged in) */}
        {user && (
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-7 h-7 rounded-full bg-[#1e1e1e] border border-[#333] flex items-center justify-center text-[#ff6b2b] font-bold text-xs cursor-pointer"
          >
            {user.username?.charAt(0).toUpperCase() || "U"}
          </button>
        )}

        {/* Hamburger */}
        <div ref={mobileMenuRef} className="relative">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-8 h-8 flex flex-col items-center justify-center gap-[5px] cursor-pointer rounded border border-[#1e1e1e] hover:border-[#333] transition-colors"
            aria-label="Menu"
          >
            <span className={`block w-4 h-[1.5px] bg-[#888] transition-all duration-200 ${isMobileMenuOpen ? "rotate-45 translate-y-[6.5px]" : ""}`} />
            <span className={`block w-4 h-[1.5px] bg-[#888] transition-all duration-200 ${isMobileMenuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-4 h-[1.5px] bg-[#888] transition-all duration-200 ${isMobileMenuOpen ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
          </button>

          {/* Mobile dropdown menu */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-48 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg shadow-2xl py-2 z-50">
              {user && (
                <div className="px-4 py-2 border-b border-[#1e1e1e] mb-1">
                  <p className="text-sm font-mono text-white truncate">{user.username}</p>
                  <p className="text-[10px] text-[#666] truncate">{user.email}</p>
                </div>
              )}
              <button onClick={() => navigate("/")} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-white hover:bg-[#111] text-[11px] uppercase tracking-wider font-semibold transition-colors">Home</button>
              <button onClick={() => navigate("/leaderboard")} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-white hover:bg-[#111] text-[11px] uppercase tracking-wider font-semibold transition-colors">Leaderboard</button>
              {!user ? (
                <button onClick={() => navigate("/auth")} className="w-full text-left px-4 py-2.5 text-[#ff6b2b] hover:bg-[#111] text-[11px] uppercase tracking-wider font-semibold transition-colors">Sign In</button>
              ) : (
                <button onClick={() => { setIsMobileMenuOpen(false); onLogout(); }} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-[#ff6b2b] hover:bg-[#111] text-[11px] uppercase tracking-wider font-semibold transition-colors">Sign Out</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile account dropdown (avatar tap) */}
      {user && isDropdownOpen && (
        <div ref={dropdownRef} className="md:hidden absolute right-16 top-[calc(100%+4px)] w-48 bg-[#0a0a0a] border border-[#1e1e1e] rounded-lg shadow-2xl py-1.5 z-50">
          <div className="px-4 py-2 border-b border-[#1e1e1e] mb-1">
            <p className="text-sm font-mono text-white truncate">{user.username}</p>
            <p className="text-[10px] text-[#666] truncate">{user.email}</p>
          </div>
          <button onClick={() => { setIsDropdownOpen(false); onLogout(); }} className="w-full text-left px-4 py-2.5 text-[#666] hover:text-[#ff6b2b] hover:bg-[#111] text-[11px] uppercase tracking-wider font-semibold transition-colors">Sign Out</button>
        </div>
      )}
    </div>
  );
};

export default Navbar;
