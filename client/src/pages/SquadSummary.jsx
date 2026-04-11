import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { Users, IndianRupee, Trophy, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SquadSummary({ embedded = false }) {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      setTeams(data.teams || []);
      setLoading(false);
    });

    socket.on('state-updated', (data) => {
      setTeams(data.teams);
    });

    return () => {
      socket.off('state-updated');
    };
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ height: embedded ? '300px' : '100vh', background: embedded ? 'transparent' : 'var(--bg-color)' }}>
         <div className="animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Loading Auction Summary...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: embedded ? 'auto' : '100vh', padding: embedded ? '0' : '2rem', background: embedded ? 'transparent' : 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {!embedded && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <div>
              <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem' }}>Final Squad Status</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Real-time overview of all teams, purse, and players</p>
            </div>
            <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none' }}>
              Back to Home
            </Link>
          </div>
        )}

        {embedded && (
          <h2 style={{ marginBottom: '2rem', fontSize: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            All Teams Overview
          </h2>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
          {teams.map(team => (
            <div key={team.id} className="glass-panel animate-pop-in" style={{ padding: '0', overflow: 'hidden' }}>
              
              {/* Team Header */}
              <div style={{ background: team.color, padding: '1.2rem 1.5rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', minHeight: '120px', gap: '1rem', boxSizing: 'border-box' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: team.name.length > 20 ? '1.25rem' : '1.4rem', lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.3)', wordWrap: 'break-word', margin: 0 }}>{team.name}</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', opacity: 0.9, fontSize: '0.85rem', marginTop: '0.4rem' }}>
                    <Users size={14} /> Total Squad: {team.players.length}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '1px', margin: 0, paddingBottom: '0.2rem' }}>Purse Left</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, lineHeight: '1' }}>{team.budget} Cr</p>
                </div>
              </div>

              {/* Player List */}
              <div style={{ padding: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                {team.players.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0' }}>
                    <p style={{ fontStyle: 'italic' }}>No buys yet.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {team.players.map((p, idx) => (
                      <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.6rem 0.8rem', borderRadius: '8px', borderLeft: `3px solid ${team.color}`, display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                        {p.image && (
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} 
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                            {p.name} 
                            {p.country && p.country !== 'India' && <span title={p.country} style={{ cursor: 'help' }}>✈️</span>}
                            <span style={{ fontSize: '0.75rem', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                              ★ {p.rating}
                            </span>
                          </p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.role}</p>
                        </div>
                        <div style={{ color: 'var(--text-accent)', fontWeight: '900', fontSize: '1.1rem' }}>
                          {p.soldPrice} Cr
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Stats */}
              {team.players.length > 0 && (
                 <div style={{ padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Rating: {(team.players.reduce((sum, p) => sum + p.rating, 0)).toFixed(1)}</span>
                    <span style={{ color: 'var(--text-secondary)' }}>Avg Rating: {(team.players.reduce((sum, p) => sum + p.rating, 0) / team.players.length).toFixed(1)}</span>
                 </div>
              )}

            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
