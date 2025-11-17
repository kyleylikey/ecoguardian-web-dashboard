const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.use(express.json());

// detect if resolved_at exists (safe update later)
let hasResolvedAt = false;
db.all(`PRAGMA table_info('RiskDetection')`, (err, cols) => {
  if (!err && Array.isArray(cols)) {
    hasResolvedAt = cols.some(c => c.name === 'resolved_at');
  }
});

// List risk detections
router.get('/', (req, res) => {
  const sql = `
    SELECT riskID as id, nodeID, readingID, risk_type, risk_level, confidence, timestamp, resolved${hasResolvedAt ? ', resolved_at' : ''}
    FROM RiskDetection
    ORDER BY datetime(timestamp) DESC
    LIMIT 500
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// Get single detection
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ data: row });
  });
});

// Get all readings for a detection, including subsequent readings for the node
router.get('/:id/readings', (req, res) => {
  const riskID = req.params.id;

  // first, get the RiskDetection row
  db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [riskID], (err, riskRow) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!riskRow) return res.status(404).json({ data: [] });

    const nodeID = riskRow.nodeID;
    const riskTs = riskRow.timestamp;

    // fetch all readings for the node since the alert
    const sql = `
      SELECT r.sensorReadingID AS id, r.nodeID, r.timestamp, r.temperature, r.humidity, r.co_level, r.latitude, r.longitude, r.altitude, r.fix
      FROM Readings r
      WHERE r.nodeID = ? AND datetime(r.timestamp) >= datetime(?)
      ORDER BY datetime(r.timestamp) ASC
    `;
    db.all(sql, [nodeID, riskTs], (err2, readings) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ data: readings || [] });
    });
  });
});

// Create a new RiskDetection (and optionally link an existing reading)
router.post('/', (req, res) => {
  const { nodeID, readingID = null, risk_type, risk_level = null, confidence = null } = req.body || {};
  if (!nodeID || !risk_type) return res.status(400).json({ error: 'nodeID and risk_type required' });

  const sql = `
    INSERT INTO RiskDetection (nodeID, readingID, risk_type, risk_level, confidence, timestamp, resolved)
    VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), 0)
  `;
  db.run(sql, [nodeID, readingID, risk_type, risk_level, confidence], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    const riskID = this.lastID;
    db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [riskID], (gErr, row) => {
      if (gErr) return res.status(201).json({ ok: true, id: riskID });
      // broadcast SSE to risk clients
      try {
        const clients = req.app.locals.sseRiskClients || [];
        const payload = JSON.stringify({ data: row });
        clients.forEach((clientRes) => {
          try {
            clientRes.write(`event: risk_created\n`);
            clientRes.write(`data: ${payload}\n\n`);
          } catch (e) {}
        });
      } catch (e) { /* ignore */ }
      return res.status(201).json({ data: row });
    });
  });
});

// Resolve an existing detection (manual)
router.post('/:id/resolve', (req, res) => {
  const id = req.params.id;
  const sql = hasResolvedAt
    ? `UPDATE RiskDetection SET resolved = 1, resolved_at = datetime('now','localtime') WHERE riskID = ?`
    : `UPDATE RiskDetection SET resolved = 1 WHERE riskID = ?`;

  db.run(sql, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });

    // fetch row to include in SSE payload
    db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [id], (gErr, row) => {
      // broadcast SSE risk_resolved
      try {
        const clients = req.app.locals.sseRiskClients || [];
        const payload = JSON.stringify({ data: row || { riskID: Number(id) } });
        clients.forEach((clientRes) => {
          try {
            clientRes.write(`event: risk_resolved\n`);
            clientRes.write(`data: ${payload}\n\n`);
          } catch (e) {}
        });
      } catch (e) { /* ignore */ }

      return res.json({ ok: true, id: Number(id) });
    });
  });
});

module.exports = router;
