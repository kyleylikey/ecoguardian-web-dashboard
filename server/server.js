const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const os = require('os');

const app = express();

// prefer explicit client origin for CORS; set CLIENT_ORIGIN env var in dev if needed
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// Initialize DB
require('./db/db');

// Middleware
// reflect request origin so browser sees an exact match; allow credentials
app.use(cors({ origin: true, credentials: true }));

// respond to preflight requests
app.options('/*', cors({ origin: true, credentials: true }));

app.use(express.json());

// simple logger to debug CORS/SSE requests
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url, 'Origin:', req.headers.origin);
  next();
});

// ----------------------
// SSE setup for live readings
// ----------------------
app.locals.sseClients = [];

app.get('/sse/readings', (req, res) => {
  // mirror the incoming Origin header exactly (required when credentials: true)
  const origin = req.headers.origin || CLIENT_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  res.write(': connected\n\n');

  app.locals.sseClients.push(res);
  req.on('close', () => {
    app.locals.sseClients = app.locals.sseClients.filter((c) => c !== res);
  });
});

// ----------------------
// SSE setup for live sensornodes
// ----------------------
app.locals.sseSensorNodeClients = [];

app.get('/sse/sensornodes', (req, res) => {
  const origin = req.headers.origin || CLIENT_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // send a comment to keep connection alive on some proxies
  res.write(': connected\n\n');

  app.locals.sseSensorNodeClients.push(res);
  req.on('close', () => {
    app.locals.sseSensorNodeClients = app.locals.sseSensorNodeClients.filter(r => r !== res);
  });
});

// ----------------------
// SSE setup for live risk detections
// ----------------------
app.locals.sseRiskClients = [];

app.get('/sse/risks', (req, res) => {
  const origin = req.headers.origin || CLIENT_ORIGIN;
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // keep-alive comment
  res.write(': connected\n\n');

  app.locals.sseRiskClients.push(res);
  req.on('close', () => {
    app.locals.sseRiskClients = app.locals.sseRiskClients.filter(r => r !== res);
  });
});

// ----------------------
// Mount API routes (must come BEFORE static/catch-all)
// ----------------------
const readingsRoutes = require('./routes/readings');
app.use('/api/readings', readingsRoutes);

const loraRoutes = require('./routes/lora');
app.use('/api/lora', loraRoutes);

const sensorNodeRoutes = require('./routes/sensornodes');
app.use('/api/sensornodes', sensorNodeRoutes);

const riskRoutes = require('./routes/riskdetection');
app.use('/api/riskdetection', riskRoutes);

// ----------------------
// 3️⃣ Serve frontend build (React app built with Vite)
// ----------------------
app.use(express.static(path.join(__dirname, '../dist')));

// Catch-all to serve React for any non-API routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// ----------------------
// 4️⃣ Start server
// ----------------------
const port = process.env.PORT || 3000;
const server = http.createServer(app);

server.listen(port, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  const allAddrs = Object.values(nets).flat().filter(Boolean);
  const ip =
    allAddrs.find((i) => i.family === 'IPv4' && !i.internal)?.address ||
    '192.168.1.4';


  console.log(`✅ EcoGuardian API up and running on:`);
  console.log(`   • Local:   http://localhost:${port}`);
  console.log(`   • Network: http://${ip}:${port}`);
});
