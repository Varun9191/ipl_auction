import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

export default function DisplayScreen() {
  const [sets, setSets] = useState({});
  const [teams, setTeams] = useState([]);
  const [state, setState] = useState({ currentSet: null, currentPlayer: null });
  const [animationClass, setAnimationClass] = useState('animate-pop-in');

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      setSets(data.players || {});
      setTeams(data.teams || []);
      setState(data.state || { currentSet: null, currentPlayer: null });
    });

    socket.on('state-updated', (data) => {
      setSets(data.players);
      setTeams(data.teams);

      const oldPlayer = state.currentPlayer;
      setState(data.state);

      if (data.event === 'PLAYER_SELECTED') {
        setAnimationClass('');
        setTimeout(() => setAnimationClass('animate-pop-in'), 10);
      }
    });

    return () => {
      socket.off('state-updated');
    };
  }, [state.currentPlayer]);

  let activePlayer = null;
  if (state.currentSet && state.currentPlayer && sets[state.currentSet]) {
    activePlayer = sets[state.currentSet].find(p => p.id === state.currentPlayer);
  }

  if (!activePlayer) {
    return (
      <div className="flex-center" style={{ height: '100vh', flexDirection: 'column' }}>
        <h1 className="text-gradient" style={{ fontSize: '5rem', marginBottom: '1rem', textAlign: 'center' }}>IPL AUCTION</h1>
        <p style={{ fontSize: '2rem', color: 'var(--text-secondary)' }}>Waiting for auctioneer...</p>
      </div>
    );
  }

  const teamBought = teams.find(t => t.id === activePlayer.team);

  return (
    <div className="flex-center" style={{ height: '100vh', padding: '2rem', position: 'relative' }}>
      <div className={`glass-panel ${animationClass}`} style={{ width: '100%', maxWidth: '1000px', padding: '4rem', display: 'flex', gap: '4rem', position: 'relative', overflow: 'hidden' }}>

        {/* Profile Image */}
        <div style={{ width: '300px', height: '400px', background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(255,255,255,0.1)' }}>
          {activePlayer.image ? (
            <img 
              src={activePlayer.image} 
              alt={activePlayer.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.parentNode.innerHTML = '<span style="font-size: 10rem; opacity: 0.1">👤</span>'; }}
            />
          ) : (
            <span style={{ fontSize: '10rem', opacity: 0.1 }}>👤</span>
          )}
        </div>

        {/* Stats */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ display: 'inline-block', background: 'var(--accent-color)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '1rem', width: 'fit-content', marginBottom: '1rem' }}>
            Set: {state.currentSet}
          </div>
          <h1 style={{ fontSize: '4.5rem', lineHeight: '1.1', marginBottom: '0.5rem' }}>
            {activePlayer.name} {activePlayer.country && activePlayer.country !== 'India' && <span title={activePlayer.country} style={{ cursor: 'help', fontSize: '3.5rem' }}>✈️</span>}
          </h1>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-accent)', marginBottom: '2rem', fontWeight: 300 }}>{activePlayer.role} • {activePlayer.country}</h2>

          <div style={{ display: 'flex', gap: '3rem', marginBottom: '2rem' }}>
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Base Price</p>
              <p style={{ fontSize: '3.5rem', fontWeight: 900 }}>{activePlayer.basePrice} <span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Cr</span></p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {activePlayer.pointsPerMatch && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <p style={{ fontSize: '1.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>Fantasy Pts:</p>
                <span style={{ color: '#10b981', fontSize: '3.5rem', fontWeight: '900' }}>
                  {activePlayer.pointsPerMatch}
                </span>
                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>per match</span>
              </div>
            )}
          </div>
        </div>

        {/* Stamps & Banners */}
        {activePlayer.status === 'sold' && (
          <>
            <div className="sold-stamp">SOLD</div>
            {teamBought && (
              <div className="animate-slide-up" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: teamBought.color, color: 'white', padding: '1rem 2rem', textAlign: 'center', fontSize: '2rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '4px' }}>
                Sold to {teamBought.name} for {activePlayer.soldPrice} Cr
              </div>
            )}
          </>
        )}

        {activePlayer.status === 'unsold' && (
          <div className="unsold-stamp">UNSOLD</div>
        )}
      </div>
    </div>
  );
}
