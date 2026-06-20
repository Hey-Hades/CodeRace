import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './components/Home.jsx';
import Lobby from './components/Lobby.jsx';
import Race from './components/Race.jsx';
import Result from './components/Result.jsx';
import Leaderboard from './components/Leaderboard.jsx'; // <-- 1. Import Leaderboard
import './App.css';

const NavBar = () => {
  const location = useLocation();
  
  return (
    <div className="nav">
      <div className="logo">Code<span>Race</span>..</div>
      <div className="nav-links">
        <Link to="/" className={`nl ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
        <Link to="/lobby" className={`nl ${location.pathname === '/lobby' ? 'active' : ''}`}>Lobby</Link>
        <Link to="/race" className={`nl ${location.pathname === '/race' ? 'active' : ''}`}>Race</Link>
        <Link to="/result" className={`nl ${location.pathname === '/result' ? 'active' : ''}`}>Result</Link>
        <Link to="/leaderboard" className={`nl ${location.pathname === '/leaderboard' ? 'active' : ''}`}>Leaderboard</Link> {/* <-- 2. Add Nav Link */}
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="r">
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/race" element={<Race />} />
          <Route path="/result" element={<Result />} />
          <Route path="/leaderboard" element={<Leaderboard />} /> {/* <-- 3. Add Route */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;