const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors    = require('cors');
const { registerHandlers } = require('./socketHandlers');
const { initCache } = require('./dataManager');

// Pre-load data into memory
(async () => {
    await initCache();
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

app.get('/', (_req, res) => res.send('⚡ IPL Auction Backend is LIVE and Connected! 📡'));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

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
