const express = require('express');
const cors = require('cors');
const http = require('http');

const app = express();

// Initialize DB 
require('./db/db');

// Middleware
app.use(cors());
app.use(express.json());

// store SSE clients
app.locals.sseClients = [];

app.get('/sse/readings', (req, res) => {
  // Required SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // send a comment/heartbeat to establish connection in some proxies
  res.write(': connected\n\n');

  // add to client list
  app.locals.sseClients.push(res);

  req.on('close', () => {
    app.locals.sseClients = app.locals.sseClients.filter((c) => c !== res);
  });
});

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'EcoGuardian API' });
});

//Routes
//readings
const readingsRoutes = require('./routes/readings');
app.use("/api/readings", readingsRoutes);

//Lora
const loraRoutes = require('./routes/lora');
app.use("/api/lora", loraRoutes);

const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, () => {
  console.log(`EcoGuardian API up on http://localhost:${port}`);
});
