const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.use(express.json());

// create node (optional client-supplied nodeID, optional name)
router.post('/', (req, res) => {
  const nodeID = req.body?.nodeID;
  const status = req.body?.status || 'active';
  const providedName = req.body?.name ?? null;

  const respondWithRow = (row) => {
    // broadcast to SSE clients
    try {
      const clients = req.app.locals.sseSensorNodeClients || [];
      const payload = JSON.stringify({ data: row });
      console.log('Broadcasting sensornode SSE to', clients.length, 'clients for nodeID', row.nodeID);
      clients.forEach((clientRes) => {
        try {
          clientRes.write(`event: sensornode\n`);
          clientRes.write(`data: ${payload}\n\n`);
        } catch (e) {
          console.warn('SSE write error:', e.message);
        }
      });
    } catch (e) {
      console.warn('Failed to broadcast sensornode SSE:', e.message);
    }
    res.status(201).json({ data: row });
  };

  if (nodeID !== undefined && nodeID !== null) {
    const nameToInsert = providedName ?? `Node ${nodeID}`;
    db.run(
      `INSERT OR IGNORE INTO SensorNode (nodeID, name, status, last_seen) VALUES (?, ?, ?, datetime('now','localtime'))`,
      [nodeID, nameToInsert, status],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        db.get(`SELECT * FROM SensorNode WHERE nodeID = ?`, [nodeID], (e, row) => {
          if (e) return res.status(500).json({ error: e.message });
          respondWithRow(row);
        });
      }
    );
  } else {
    db.run(
      `INSERT INTO SensorNode (status, last_seen) VALUES (?, datetime('now','localtime'))`,
      [status],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });
        const id = this.lastID;
        const nameToSet = providedName ?? `Node ${id}`;
        db.run(
          `UPDATE SensorNode SET name = ? WHERE nodeID = ?`,
          [nameToSet, id],
          (uErr) => {
            if (uErr) return res.status(500).json({ error: uErr.message });
            db.get(`SELECT * FROM SensorNode WHERE nodeID = ?`, [id], (e, row) => {
              if (e) return res.status(500).json({ error: e.message });
              respondWithRow(row);
            });
          }
        );
      }
    );
  }
});

// list nodes
router.get('/', (req, res) => {
  db.all(`SELECT * FROM SensorNode ORDER BY nodeID ASC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ data: rows });
  });
});

// get single node
router.get('/:id', (req, res) => {
  db.get(`SELECT * FROM SensorNode WHERE nodeID = ?`, [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ data: row });
  });
});

module.exports = router;