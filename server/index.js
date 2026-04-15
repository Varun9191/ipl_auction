const express = require('express');
const http    = require('http');
const path    = require('path');
const fs      = require('fs');
const { Server } = require('socket.io');
const cors    = require('cors');
const { registerHandlers } = require('./socketHandlers');
const { initCache, syncSoldPlayers } = require('./dataManager');

// Pre-load data into memory
(async () => {
    await initCache();
    await syncSoldPlayers();
})();

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { 
    origin: (origin, callback) => callback(null, true), 
    methods: ['GET', 'POST'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
  },
  transports: ['websocket', 'polling']
});

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const clientDist = path.join(__dirname, '..', 'client', 'dist');
const indexHtml  = path.join(clientDist, 'index.html');
const hasSpa     = fs.existsSync(indexHtml);

if (hasSpa) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();
    if (req.path.startsWith('/socket.io')) return next();
    res.sendFile(indexHtml, (err) => (err ? next(err) : undefined));
  });
} else {
  app.get('/', (_req, res) => res.send('⚡ IPL Auction Backend is LIVE and Connected! 📡'));
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  registerHandlers(io, socket);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅  IPL Auction Server running on port ${PORT}`);
  console.log(`   Local:   http://localhost:${PORT}`);
});
