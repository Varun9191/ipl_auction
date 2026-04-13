import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { UserX, IndianRupee, MapPin, User, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UnsoldPlayers() {
  const [unsoldPlayers, setUnsoldPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      processPlayers(data.players || {});
      setLoading(false);
    });

    socket.on('state-updated', (data) => {
      processPlayers(data.players || {});
    });

    return () => {
      socket.off('state-updated');
    };
  }, []);

  const processPlayers = (sets) => {
    const allUnsold = [];
    Object.keys(sets).forEach(setId => {
      sets[setId].forEach(player => {
        if (player.status === 'unsold') {
          allUnsold.push({ ...player, setId });
        }
      });
    });
    setUnsoldPlayers(allUnsold);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '100vh', background: 'var(--bg-color)' }}>
         <div className="animate-pulse" style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>Loading Unsold Pool...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', background: 'var(--bg-color)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
          <div>
            <h1 className="text-gradient" style={{ fontSize: '3.5rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <UserX size={48} /> Unsold Players
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>Players currently available for re-auction</p>
          </div>
          <Link to="/" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ChevronLeft size={18} /> Back to Home
          </Link>
        </div>

        {unsoldPlayers.length === 0 ? (
          <div className="glass-panel flex-center" style={{ padding: '5rem', flexDirection: 'column', gap: '1rem' }}>
            <User size={64} style={{ opacity: 0.2 }} />
            <h2 style={{ color: 'var(--text-secondary)' }}>The unsold pool is currently empty.</h2>
            <p style={{ color: 'rgba(255,255,255,0.3)' }}>All players have either been sold or are yet to be auctioned.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '2rem' }}>
            {unsoldPlayers.map(player => (
              <div key={player.id} className="glass-panel animate-pop-in" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'relative', height: '200px', background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 100%)' }}>
                  {player.image ? (
                    <img 
                      src={player.image} 
                      alt={player.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: -1 }} 
                      onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.style.background = 'var(--bg-secondary)'; }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={60} style={{ opacity: 0.1 }} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-accent)', fontWeight: 'bold', letterSpacing: '1px' }}>
                      Set {player.setId} • {player.role}
                    </div>
                    <h3 style={{ margin: '0.2rem 0', fontSize: '1.3rem', color: 'white' }}>{player.name}</h3>
                  </div>
                </div>

                <div style={{ padding: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <MapPin size={14} /> {player.country}
                    </div>
                    <div style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(251, 191, 36, 0.2)' }}>
                      Pts: {player.recentSeasons > 0 ? Math.round(player.fantasyPoints / player.recentSeasons) : 0}
                    </div>
                  </div>
                  
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Base Price</span>
                    <strong style={{ fontSize: '1.2rem', color: 'white' }}>{player.basePrice} Cr</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
