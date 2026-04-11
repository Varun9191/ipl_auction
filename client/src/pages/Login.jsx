import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../socket';
import { Lock, User, ShieldCheck, Users, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(searchParams.get('mode') || 'team'); // 'admin' or 'team'
  const [teamId, setTeamId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState([]);

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      setTeams(data.teams || []);
    });
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!password) return;
    if (mode === 'team' && !teamId) return;

    setLoading(true);
    setError('');

    const payload = mode === 'admin' 
        ? { role: 'admin', password } 
        : { role: 'team', teamId, password };

    socket.emit('login', payload, (res) => {
      setLoading(false);
      if (res.success) {
        localStorage.setItem('ipl_auction_auth', JSON.stringify(res));
        if (res.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(`/team/${res.teamId}`);
        }
      } else {
        setError(res.message || 'Login failed');
      }
    });
  };

  return (
    <div className="flex-center" style={{ minHeight: '100vh', background: 'var(--bg-color)', padding: '2rem' }}>
      <div className="glass-panel animate-pop-in" style={{ width: '100%', maxWidth: '450px', padding: '3rem', position: 'relative' }}>
        
        {/* Logo/Icon */}
        <div className="flex-center" style={{ marginBottom: '2rem' }}>
          <div style={{ width: '80px', height: '80px', background: 'var(--accent-color)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px var(--accent-color)44' }}>
            <Lock size={40} color="white" />
          </div>
        </div>

        <h1 style={{ textAlign: 'center', marginBottom: '0.5rem', fontSize: '2.5rem' }}>Access Portal</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>Login to continue to the auction floor</p>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-secondary)', padding: '0.4rem', borderRadius: '12px', marginBottom: '2rem' }}>
          <button 
            onClick={() => setMode('team')}
            style={{ 
              flex: 1, padding: '0.8rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: mode === 'team' ? 'var(--bg-color)' : 'transparent',
              color: mode === 'team' ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: mode === 'team' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <Users size={18} /> Team
          </button>
          <button 
            onClick={() => setMode('admin')}
            style={{ 
              flex: 1, padding: '0.8rem', border: 'none', borderRadius: '10px', cursor: 'pointer',
              background: mode === 'admin' ? 'var(--bg-color)' : 'transparent',
              color: mode === 'admin' ? 'white' : 'var(--text-secondary)',
              fontWeight: 'bold', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              boxShadow: mode === 'admin' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            <ShieldCheck size={18} /> Admin
          </button>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {mode === 'team' && (
            <div style={{ position: 'relative' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select Your Team</label>
              <div style={{ position: 'relative' }}>
                <Users size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <select 
                  required
                  value={teamId} 
                  onChange={(e) => setTeamId(e.target.value)}
                  style={{ width: '100%', padding: '1rem 1rem 1rem 3rem' }}
                >
                  <option value="">-- Choose Team --</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>
          )}

          {mode === 'admin' && (
             <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Admin Access</label>
                <div style={{ position: 'relative' }}>
                    <ShieldCheck size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                    <input 
                      type="text" 
                      value="Auction Administrator" 
                      disabled
                      style={{ width: '100%', padding: '1rem 1rem 1rem 3rem', background: 'rgba(255,255,255,0.05)', color: 'white', opacity: 0.6 }}
                    />
                </div>
             </div>
          )}

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Access Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                required
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '1rem 3.5rem 1rem 3rem' }}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="animate-shake" style={{ color: 'var(--unsold-color)', fontSize: '0.9rem', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', padding: '0.8rem', borderRadius: '8px' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '1.2rem', justifyContent: 'center', fontSize: '1.1rem', marginTop: '1rem' }}
          >
            {loading ? 'Verifying...' : 'Unlock Dashboard'} <ArrowRight size={20} style={{ marginLeft: '0.5rem' }} />
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          By logging in, you agree to the auction rules and fair play guidelines.
        </p>

      </div>
    </div>
  );
}
