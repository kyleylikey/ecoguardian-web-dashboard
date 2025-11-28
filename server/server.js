const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');

const app = express();

// Prefer explicit client origin for CORS
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Initialize DB
require('./db/db');

// ----------------------
// Middleware
// ----------------------
app.use(cors({ origin: true, credentials: true }));
app.options('/*', cors({ origin: true, credentials: true }));
app.use(express.json());

// ----------------------
// WebSocket Server Setup
// ----------------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const wsClients = new Set();

wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket client connected');
  wsClients.add(ws);

  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'connection', 
    message: 'Connected to EcoGuardian WebSocket server',
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    console.log('📨 Received from client:', message.toString());
    // Optional: Handle client messages here
  });

  ws.on('close', () => {
    console.log('🔌 Client disconnected');
    wsClients.delete(ws);
    console.log(`   Active connections: ${wsClients.size}`);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
    wsClients.delete(ws);
  });

  console.log(`   Active connections: ${wsClients.size}`);
});

// Make wsClients available to routes
app.set('wsClients', wsClients);

// ----------------------
// API Routes
// ----------------------
const sensorNodesRoutes = require("./routes/sensornodes");
const readingsRoutes = require('./routes/readings');
const risksRoutes = require('./routes/risks');
const loraRoutes = require('./routes/lora');

// Register routes
app.use("/api/sensornodes", sensorNodesRoutes);
app.use("/api/readings", readingsRoutes);
app.use("/api/risks", risksRoutes);
app.use("/api/lora", loraRoutes);

// ----------------------
// Serve Frontend (React/Vite Build)
// ----------------------
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ----------------------
// Start Server
// ----------------------
const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const allAddrs = Object.values(nets).flat().filter(Boolean);
  const localIP = allAddrs.find((i) => i.family === 'IPv4' && !i.internal)?.address || 'localhost';

  console.log('\n✅ EcoGuardian Server Started');
  console.log('─────────────────────────────────');
  console.log(`📍 Local:   http://localhost:${PORT}`);
  console.log(`📍 Network: http://${localIP}:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('─────────────────────────────────\n');
});
