const { readData, writeData } = require('./dataManager');
const { v4: uuidv4 } = require('uuid');

function registerHandlers(io, socket) {
  // ── Authentication ────────────────────────────────────────────────────────
  socket.on('login', (payload, callback) => {
    const config = readData('config.json');
    const teams  = readData('teams.json');

    if (payload.role === 'admin') {
      if (payload.password === config.adminPassword) {
        return callback({ success: true, role: 'admin' });
      }
    } else {
      const team = teams.find(t => t.id === payload.teamId);
      if (team && payload.password === team.password) {
        return callback({ success: true, role: 'team', teamId: team.id });
      }
    }
    callback({ success: false, message: 'Invalid credentials' });
  });

  // ── Get initial state ──────────────────────────────────────────────────────

  socket.on('get-initial-state', (callback) => {
    const players = readData('players.json');
    const teams   = readData('teams.json');
    const state   = readData('state.json');
    if (typeof callback === 'function') {
      callback({ players, teams, state });
    }
  });

  // ── Admin: update player / auction actions ─────────────────────────────────
  socket.on('update-player', async (payload) => {
    const players = readData('players.json');
    const teams   = readData('teams.json');
    const state   = readData('state.json');
    let event     = '';

    switch (payload.action) {

      case 'SELECT_PLAYER': {
        state.currentSet    = payload.setId;
        state.currentPlayer = payload.playerId;
        event = 'PLAYER_SELECTED';
        break;
      }

      case 'SELL_PLAYER': {
        const set    = players[payload.setId];
        const player = set?.find(p => p.id === payload.playerId);
        const team   = teams.find(t => t.id === payload.teamId);
        if (player && team) {
          if (team.budget < payload.soldPrice) {
            console.log(`❌ Sale failed: ${team.name} has insufficient budget (${team.budget} Cr) for ${player.name} (${payload.soldPrice} Cr)`);
            return;
          }
          player.status    = 'sold';
          player.soldPrice = payload.soldPrice;
          player.team      = payload.teamId;
          team.budget     -= payload.soldPrice;
          team.players.push({
            id: player.id, name: player.name,
            role: player.role, soldPrice: payload.soldPrice,
            rating: player.rating, country: player.country,
            image: player.image
          });

          state.lastSale = {
            type: 'sold',
            setId: payload.setId,
            playerId: payload.playerId,
            teamId: payload.teamId,
            soldPrice: payload.soldPrice
          };
        }
        state.currentSet    = payload.setId;
        state.currentPlayer = payload.playerId;
        event = 'PLAYER_SOLD';
        break;
      }

      case 'UNDO_SALE': {
        if (!state.lastSale) return;
        const { type, setId, playerId, teamId, soldPrice } = state.lastSale;
        const set    = players[setId];
        const player = set?.find(p => p.id === playerId);

        if (player) {
          if (type === 'sold') {
            const team = teams.find(t => t.id === teamId);
            if (team) {
              // Revert player status
              player.status = 'available';
              player.soldPrice = null;
              player.team = null;

              // Refund team
              team.budget += soldPrice;
              
              // Remove from team players list
              team.players = team.players.filter(p => p.id !== playerId);
              
              console.log(`⏪ Undo Sold successful: ${player.name} returned from ${team.name}`);
            }
          } else if (type === 'unsold') {
            player.status = 'available';
            console.log(`⏪ Undo Unsold successful: ${player.name} is available again`);
          }

          // Set back as current player for convenience
          state.currentSet = setId;
          state.currentPlayer = playerId;
          
          state.lastSale = null;
          event = 'SALE_UNDONE';
        }
        break;
      }

      case 'UNSOLD_PLAYER': {
        const setU   = players[payload.setId];
        const playerU = setU?.find(p => p.id === payload.playerId);
        if (playerU) {
          playerU.status = 'unsold';
          
          // Track for UNDO
          state.lastSale = {
            type: 'unsold',
            setId: payload.setId,
            playerId: payload.playerId
          };
        }
        state.currentSet    = payload.setId;
        state.currentPlayer = payload.playerId;
        event = 'PLAYER_UNSOLD';
        break;
      }

      case 'CLEAR_PLAYER': {
        state.currentSet    = null;
        state.currentPlayer = null;
        event = 'PLAYER_CLEARED';
        break;
      }

      case 'APPROVE_REQUEST': {
        const req = state.playerRequests.find(r => r.id === payload.requestId);
        if (req) {
          state.currentSet    = req.setId;
          state.currentPlayer = req.playerId;
          state.playerRequests = state.playerRequests.filter(r => r.id !== payload.requestId);
          state.lastSale      = null;
          event = 'PLAYER_SELECTED';
        }
        break;
      }

      case 'REJECT_REQUEST': {
        state.playerRequests = state.playerRequests.filter(r => r.id !== payload.requestId);
        event = 'REQUEST_REJECTED';
        break;
      }
      
      case 'RESET_AUCTION': {
        // Reset all players
        for (const setId in players) {
          players[setId].forEach(p => {
            p.status = 'available';
            p.soldPrice = null;
            p.team = null;
          });
        }
        // Reset all teams
        teams.forEach(t => {
          t.budget = 120; // Default budget
          t.players = [];
        });
        // Reset global state
        state.currentSet = null;
        state.currentPlayer = null;
        state.playerRequests = [];
        state.lastSale = null;
        event = 'AUCTION_RESET';
        break;
      }

      default:
        console.warn('Unknown action:', payload.action);
        return;
    }

    // Persist changes
    await writeData('players.json', players);
    await writeData('teams.json',   teams);
    await writeData('state.json',   state);

    // Broadcast to all clients
    io.emit('state-updated', { players, teams, state, event });
  });

  // ── Team: request a player ─────────────────────────────────────────────────
  socket.on('request-player', async (payload) => {
    const state = readData('state.json');
    const existing = state.playerRequests.find(
      r => r.teamId === payload.teamId && r.playerId === payload.playerId
    );
    if (!existing) {
      state.playerRequests.push({
        id: uuidv4(),
        ...payload
      });
      await writeData('state.json', state);
    }
    io.emit('player-requested', state.playerRequests);
  });
}

module.exports = { registerHandlers };
