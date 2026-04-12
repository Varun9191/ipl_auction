import React, { useEffect, useState } from 'react';
import { socket } from '../socket';
import { Users, Gavel, CheckCircle, XCircle, RotateCcw, UserX, User } from 'lucide-react';

export default function AdminPanel() {
  const [sets, setSets] = useState({});
  const [teams, setTeams] = useState([]);
  const [state, setState] = useState({ currentSet: null, currentPlayer: null, playerRequests: [] });
  
  const [selectedSetInput, setSelectedSetInput] = useState('');
  const [selectedPlayerInput, setSelectedPlayerInput] = useState('');
  
  const [soldPrice, setSoldPrice] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('');

  useEffect(() => {
    socket.emit('get-initial-state', (data) => {
      setSets(data.players || {});
      setTeams(data.teams || []);
      setState(data.state || { currentSet: null, currentPlayer: null, playerRequests: [] });
    });

    socket.on('state-updated', (data) => {
      setSets(data.players);
      setTeams(data.teams);
      setState(data.state);
    });
    
    socket.on('player-requested', (requests) => {
      setState(prev => ({ ...prev, playerRequests: requests }));
    });

    return () => {
      socket.off('state-updated');
      socket.off('player-requested');
    };
  }, []);

  const handleSelectPlayer = () => {
    if (!selectedSetInput || !selectedPlayerInput) return;
    socket.emit('update-player', {
      action: 'SELECT_PLAYER',
      setId: selectedSetInput,
      playerId: selectedPlayerInput
    });
  };

  const handleSell = () => {
    if (!soldPrice || !selectedTeam) return;
    const finalPrice = Number(soldPrice);
    const team = teams.find(t => t.id === selectedTeam);
    
    if (team && team.budget < finalPrice) {
      alert(`⚠️ INSUFFICIENT BUDGET!\n${team.name} only has ${team.budget} Cr remaining.`);
      return;
    }

    socket.emit('update-player', {
      action: 'SELL_PLAYER',
      setId: state.currentSet,
      playerId: state.currentPlayer,
      teamId: selectedTeam,
      soldPrice: finalPrice
    });
    setSoldPrice('');
  };

  const handleUnsold = () => {
    socket.emit('update-player', {
      action: 'UNSOLD_PLAYER',
      setId: state.currentSet,
      playerId: state.currentPlayer
    });
  };
  
  const handleClear = () => {
    socket.emit('update-player', { action: 'CLEAR_PLAYER' });
  };

  const handleApproveRequest = (reqId) => {
    socket.emit('update-player', { action: 'APPROVE_REQUEST', requestId: reqId });
  };

  const handleRejectRequest = (reqId) => {
    socket.emit('update-player', { action: 'REJECT_REQUEST', requestId: reqId });
  };
  
  const handleReset = () => {
    if (window.confirm("⚠️ ATTENTION: This will permanently DELETE all current auction sales and reset all budgets to 120 Cr. Are you sure?")) {
      socket.emit('update-player', { action: 'RESET_AUCTION' });
    }
  };

  let activePlayerObj = null;
  if (state.currentSet && state.currentPlayer && sets[state.currentSet]) {
    activePlayerObj = sets[state.currentSet].find(p => p.id === state.currentPlayer);
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Gavel /> Auctioneer Control Panel
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {state.lastSale && (
            <button 
              className="btn btn-secondary animate-pulse" 
              style={{ background: 'var(--sold-color)', borderColor: 'var(--sold-color)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
              onClick={() => {
                if (window.confirm("⏪ Undo the last sale and refund the team?")) {
                  socket.emit('update-player', { action: 'UNDO_SALE' });
                }
              }}
            >
              <RotateCcw size={18} /> Undo Last Sale
            </button>
          )}
          <button className="btn btn-secondary" style={{ background: '#dc3545', borderColor: '#dc3545', display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={handleReset}>
            <RotateCcw size={18} /> Restart Auction
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Col: Setup & Auctioning */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Select Next Player</h3>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <select value={selectedSetInput} onChange={(e) => { setSelectedSetInput(e.target.value); setSelectedPlayerInput(''); }}>
                <option value="">-- Select Set --</option>
                {Object.keys(sets).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={selectedPlayerInput} onChange={(e) => setSelectedPlayerInput(e.target.value)} disabled={!selectedSetInput}>
                <option value="">-- Select Player --</option>
                {(sets[selectedSetInput] || []).filter(p => p.status === 'available' || p.status === 'unsold').map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.role}){p.status === 'unsold' ? ' [UNSOLD]' : ''}</option>
                ))}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleSelectPlayer}>Load Player to Screen</button>
          </div>

          {activePlayerObj && (
            <div className="glass-panel animate-slide-up" style={{ padding: '1.5rem', border: '1px solid var(--text-accent)' }}>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                {activePlayerObj.image && (
                  <img 
                    src={activePlayerObj.image} 
                    alt={activePlayerObj.name} 
                    style={{ width: '100px', height: '120px', borderRadius: '12px', objectFit: 'cover', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)' }} 
                    onError={(e) => { e.target.style.display = 'none'; e.target.parentNode.innerHTML += '👤'; }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h2 className="text-gradient">{activePlayerObj.name}</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>{activePlayerObj.role} • {activePlayerObj.country}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p>Base Price: <strong style={{ fontSize: '1.2rem', color: 'white' }}>{activePlayerObj.basePrice} Cr</strong></p>
                      <p>Status: <span style={{ textTransform: 'uppercase', color: activePlayerObj.status === 'sold' ? 'var(--sold-color)' : (activePlayerObj.status === 'unsold' ? 'var(--unsold-color)' : 'yellow')}}>{activePlayerObj.status}</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {(activePlayerObj.status === 'available' || activePlayerObj.status === 'unsold') && (
                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <input type="number" placeholder="Sold Price (Crores)" value={soldPrice} onChange={e => setSoldPrice(e.target.value)} step="0.01" />
                    <select value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
                      <option value="">-- Select Team --</option>
                      {teams.map(t => <option key={t.id} value={t.id}>{t.name} (Budget: {t.budget} Cr)</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-sold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleSell}>
                      <CheckCircle /> SELL
                    </button>
                    <button className="btn btn-unsold" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUnsold}>
                      <XCircle /> UNSOLD
                    </button>
                  </div>
                </div>
              )}
              {(activePlayerObj.status !== 'available' && activePlayerObj.status !== 'unsold') && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <button className="btn btn-secondary" onClick={handleClear}>Clear Projector Screen</button>
                  </div>
              )}
            </div>
          )}
        </div>

        {/* Right Col: Requests & Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users /> Player Requests from Teams
            </h3>
            {state.playerRequests.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No pending requests.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {state.playerRequests.map(req => {
                  const reqTeam = teams.find(t => t.id === req.teamId);
                  return (
                    <div key={req.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px' }}>
                      <div>
                        <strong>{req.playerName}</strong> (Set {req.setId})
                        <div style={{ fontSize: '0.8rem', color: reqTeam?.color }}>Requested by: {reqTeam?.name}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleApproveRequest(req.id)}>Approve</button>
                        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleRejectRequest(req.id)}>Reject</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Unsold Pool Section for Re-Auction */}
          <div className="glass-panel" style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--unsold-color)' }}>
              <UserX /> Unsold Pool (Re-Auction)
            </h3>
            <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.8rem', maxHeight: '500px' }}>
              {Object.keys(sets).flatMap(setId => sets[setId].map(p => ({ ...p, setId })))
                .filter(p => p.status === 'unsold')
                .length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>No players in unsold pool.</p>
                ) : (
                  Object.keys(sets).flatMap(setId => sets[setId].map(p => ({ ...p, setId })))
                    .filter(p => p.status === 'unsold')
                    .map(player => (
                      <div key={player.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                         <div style={{ width: '32px', height: '32px', background: 'var(--bg-color)', borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {player.image ? <img src={player.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={16} opacity={0.3} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{player.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Set {player.setId} • {player.basePrice} Cr</div>
                          </div>
                        </div>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }} 
                          onClick={() => {
                            socket.emit('update-player', {
                              action: 'SELECT_PLAYER',
                              setId: player.setId,
                              playerId: player.id
                            });
                          }}
                        >
                          Re-Auction
                        </button>
                      </div>
                    ))
                )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
