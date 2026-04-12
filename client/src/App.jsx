import React from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import AdminPanel from './pages/AdminPanel';
import DisplayScreen from './pages/DisplayScreen';
import TeamDashboard from './pages/TeamDashboard';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import SquadSummary from './pages/SquadSummary';
import UnsoldPlayers from './pages/UnsoldPlayers';

function Home() {
  const navigate = useNavigate();
  
  const handleAuthLink = (to, mode) => {
    const auth = JSON.parse(localStorage.getItem('ipl_auction_auth') || 'null');
    // Simple logic: if already logged in for that mode/team, go straight there, else login
    if (auth) {
        if (mode === 'admin' && auth.role === 'admin') return navigate('/admin');
        if (mode === 'team' && auth.role === 'team' && auth.teamId === to.split('/').pop()) return navigate(to);
    }
    navigate(`/login?mode=${mode}${mode === 'team' ? '&teamId=' + to.split('/').pop() : ''}`);
  };

  return (
    <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '2rem' }}>
      <h1 className="text-gradient" style={{ fontSize: '5rem', marginBottom: '1rem' }}>IPL AUCTION 2025</h1>
      
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem' }}>
          <Link to="/display" className="btn btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.2rem' }}>
            🖥️ Open Projector
          </Link>
          <Link to="/squads" className="btn btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}>
            📊 All Squads & Purse
          </Link>
          <Link to="/unsold" className="btn btn-primary" style={{ textDecoration: 'none', padding: '1rem 2rem', fontSize: '1.2rem', background: 'var(--bg-secondary)', border: '1px solid var(--accent-color)' }}>
            🛍️ Unsold Players
          </Link>
          <button onClick={() => handleAuthLink('/admin', 'admin')} className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
            🛡️ Auctioneer Admin
          </button>
        </div>

      <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px', width: '100%' }}>
        <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
          Team Access Portals
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.5rem' }}>
          {['CSK', 'MI', 'RCB', 'KKR', 'DC', 'RR', 'PBKS', 'SRH', 'LSG', 'GT'].map(teamId => (
            <button 
              key={teamId} 
              onClick={() => handleAuthLink(`/team/${teamId}`, 'team')} 
              className="btn btn-secondary flex-center" 
              style={{ padding: '1rem', width: '100%', fontWeight: 'bold' }}
            >
              {teamId}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute role="admin">
              <AdminPanel />
            </ProtectedRoute>
          } 
        />
        <Route path="/display" element={<DisplayScreen />} />
        <Route path="/squads" element={<SquadSummary />} />
        <Route path="/unsold" element={<UnsoldPlayers />} />
        <Route 
          path="/team/:teamId" 
          element={
            <ProtectedRoute role="team">
              <TeamDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
