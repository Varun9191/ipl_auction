import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
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
              {(sets[reqSet] || []).filter(p => p.status === 'available').map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.role}) - Base: {p.basePrice} Cr</option>
              ))}
            </select>

            <button className="btn btn-primary" style={{ marginTop: '1rem', justifyContent: 'center' }} onClick={handleRequest}>
              Send Request to Auctioneer
            </button>
          </div>

            {playerRequests.some(r => r.teamId === teamId) && (
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <p style={{ color: 'var(--text-accent)', fontWeight: 'bold' }}>You have a pending request!</p>
              </div>
            )}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
              {team.players.map(p => (
                <div key={p.id} style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '12px', borderLeft: `4px solid ${team.color}`, display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {p.image && (
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', background: 'rgba(255,255,255,0.05)' }} 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.1rem', lineHeight: '1.2' }}>
                      {p.name} {p.country && p.country !== 'India' && <span title={p.country} style={{ cursor: 'help' }}>✈️</span>}
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{p.role}</p>
                    <p style={{ fontSize: '1rem', fontWeight: 'bold', marginTop: '0.2rem', color: 'var(--text-accent)' }}>{p.soldPrice} Cr</p>
                  </div>
                </div>
              ))}
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
