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
  // allow the frontend origin (use specific origin in production)
  res.setHeader('Access-Control-Allow-Origin', process.env.CLIENT_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders && res.flushHeaders();

  // send a comment/heartbeat
  res.write(': connected\n\n');

  // add to clients list
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

// Your test route
app.use("/api/test", require("./routes/test"));
// Start server


const port = process.env.PORT || 3000;
const server = http.createServer(app);
server.listen(port, "0.0.0.0", () => {
  console.log(`✅ EcoGuardian API up and running on:`);
  console.log(`   • Local:   http://localhost:${port}`);
  console.log(`   • Network: http://${require('os').networkInterfaces().Ethernet?.find(i => i.family === 'IPv4')?.address || 'your-device-ip'}:${port}`);
});

