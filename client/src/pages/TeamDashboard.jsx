import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import { UserX, Send, CheckCircle, Info, User, Sword, Target, Zap, Shield } from 'lucide-react';
import SquadSummary from './SquadSummary';

export default function TeamDashboard() {
  const { teamId } = useParams();
  
  const [sets, setSets] = useState({});
  const [team, setTeam] = useState(null);
  const [playerRequests, setPlayerRequests] = useState([]);
  const [auctionState, setAuctionState] = useState({ currentSet: null, currentPlayer: null });

  const [reqSet, setReqSet] = useState('');
  const [reqPlayer, setReqPlayer] = useState('');

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      setSets(data.players || {});
      const myTeam = (data.teams || []).find(t => t.id === teamId);
      setTeam(myTeam);
      setPlayerRequests(data.state?.playerRequests || []);
      setAuctionState(data.state || { currentSet: null, currentPlayer: null });
    });

    socket.on('state-updated', (data) => {
      setSets(data.players);
      setTeam(data.teams.find(t => t.id === teamId));
      setPlayerRequests(data.state.playerRequests);
      setAuctionState(data.state);
    });

    socket.on('player-requested', (requests) => {
      setPlayerRequests(requests);
    });

    return () => {
      socket.off('state-updated');
      socket.off('player-requested');
    };
  }, [teamId]);

  const handleRequest = () => {
    if (!reqSet || !reqPlayer) return;
    const playerObj = sets[reqSet].find(p => p.id === reqPlayer);
    socket.emit('request-player', {
      teamId,
      setId: reqSet,
      playerId: reqPlayer,
      playerName: playerObj.name
    });
    setReqSet('');
    setReqPlayer('');
    alert(`Request sent for ${playerObj.name}!`);
  };

  if (!team) return <div className="flex-center" style={{height:'100vh'}}>Loading {teamId}...</div>;

  let activePlayerObj = null;
  if (auctionState.currentSet && auctionState.currentPlayer && sets[auctionState.currentSet]) {
    activePlayerObj = sets[auctionState.currentSet].find(p => p.id === auctionState.currentPlayer);
  }

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(to bottom, ${team.color}22, var(--bg-color))` }}>
      <div style={{ background: team.color, color: 'white', padding: '1rem 2rem', borderBottom: '1px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '2.5rem', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{team.name} Dashboard</h1>
        <div style={{ textAlign: 'right' }}>
          <p style={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>Remaining Budget</p>
          <p style={{ fontSize: '2.5rem', fontWeight: 900, textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{team.budget} Cr</p>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '2rem auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', padding: '0 2rem' }}>
        
        {/* Left Col: Request a Player & Active Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {activePlayerObj && (
            <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem', border: `2px solid ${team.color}`, boxShadow: `0 0 20px ${team.color}44` }}>
              <h2 style={{ marginBottom: '1rem', fontSize: '1rem', color: 'var(--text-accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>📢 Currently on Auction</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  {activePlayerObj.image && (
                    <img 
                      src={activePlayerObj.image} 
                      alt={activePlayerObj.name} 
                      style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', background: 'var(--bg-secondary)' }} 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div>
                    <h2 className="text-gradient" style={{ fontSize: '1.8rem', margin: 0, lineHeight: 1.2 }}>
                      {activePlayerObj.name} {activePlayerObj.country && activePlayerObj.country !== 'India' && <span title={activePlayerObj.country} style={{ cursor: 'help' }}>✈️</span>}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.3rem' }}>{activePlayerObj.role} • {activePlayerObj.country}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '0.8rem', margin: 0, opacity: 0.8 }}>Base Price</p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{activePlayerObj.basePrice} Cr</p>
                  <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.8 }}>Status</p>
                  <p style={{ textTransform: 'uppercase', fontWeight: 'bold', margin: 0, color: activePlayerObj.status === 'sold' ? 'var(--sold-color)' : (activePlayerObj.status === 'unsold' ? 'var(--unsold-color)' : 'yellow') }}>
                    {activePlayerObj.status}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Request Next Player</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Send a request to the auctioneer to bring a skipped or upcoming player to the floor.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select value={reqSet} onChange={(e) => { setReqSet(e.target.value); setReqPlayer(''); }}>
              <option value="">-- Select Set --</option>
              {Object.keys(sets).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            
            <select value={reqPlayer} onChange={(e) => setReqPlayer(e.target.value)} disabled={!reqSet}>
              <option value="">-- Select Player --</option>
              {(sets[reqSet] || []).filter(p => p.status === 'available' || p.status === 'unsold').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role}){p.status === 'unsold' ? ' [UNSOLD]' : ''} - Base: {p.basePrice} Cr</option>
              ))}
            </select>

            <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }} onClick={handleRequest}>
              Send Request to Auctioneer
            </button>
          </div>

            {playerRequests.some(r => r.teamId === teamId) && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                <CheckCircle size={18} color="var(--accent-color)" />
                <p style={{ color: 'var(--text-accent)', fontWeight: 'bold', margin: 0 }}>You have a pending request!</p>
              </div>
            )}
          </div>

          {/* Unsold Pool Section */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserX size={20} /> Unsold Pool
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>Recently skipped players. Request them to bring them back.</p>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingRight: '0.5rem' }}>
              {Object.keys(sets).flatMap(setId => sets[setId])
                .filter(p => p.status === 'unsold')
                .length === 0 ? (
                  <p style={{ textAlign: 'center', opacity: 0.5, padding: '2rem 0' }}>Pool is empty</p>
                ) : (
                  Object.keys(sets).flatMap(setId => sets[setId].map(p => ({ ...p, setId })))
                    .filter(p => p.status === 'unsold')
                    .map(player => (
                      <div key={player.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                          <div style={{ width: '32px', height: '32px', background: 'var(--bg-secondary)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {player.image ? <img src={player.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} opacity={0.3} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{player.name}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Set {player.setId} • {player.role}</div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => {
                            socket.emit('request-player', {
                              teamId,
                              setId: player.setId,
                              playerId: player.id,
                              playerName: player.name
                            });
                            alert(`Request sent for ${player.name}!`);
                          }}
                        >
                          Request
                        </button>
                      </div>
                    ))
                )}
            </div>
          </div>
        </div>

        {/* Right Col: Squad */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            Current Squad ({team.players.length})
          </h2>
          {team.players.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No players acquired yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {[
                { label: 'Batters', role: 'Batter', icon: <Sword size={18} /> },
                { label: 'Wicketkeepers', role: 'Wicketkeeper', icon: <Shield size={18} /> },
                { label: 'All-Rounders', role: 'All-Rounder', icon: <Zap size={18} /> },
                { label: 'Bowlers', role: 'Bowler', icon: <Target size={18} /> }
              ].map(cat => {
                const players = team.players.filter(p => p.role === cat.role);
                if (players.length === 0) return null;
                
                return (
                  <div key={cat.role}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-accent)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {cat.icon} {cat.label} ({players.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.2rem' }}>
                      {players.map(p => (
                        <div key={p.id} className="animate-pop-in" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${team.color}`, display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                            {p.image ? (
                              <img 
                                src={p.image} 
                                alt={p.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = '👤'; }}
                              />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}><User size={24} /></div>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '1rem', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name} {p.country && p.country !== 'India' && <span title={p.country}>✈️</span>}
                            </h4>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.country}</p>
                            <p style={{ fontSize: '1.1rem', fontWeight: '900', marginTop: '0.2rem', color: 'white' }}>{p.soldPrice} Cr</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <div style={{ maxWidth: '1400px', margin: '4rem auto 2rem auto', padding: '0 2rem' }}>
        <SquadSummary embedded={true} />
      </div>

    </div>
  );
}
