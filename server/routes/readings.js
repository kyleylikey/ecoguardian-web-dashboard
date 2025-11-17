const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.use(express.json());

// GET /api/readings
// optional query: nodeID, since (ISO timestamp), limit
router.get("/", (req, res) => {
  const nodeID = req.query.nodeID ? Number(req.query.nodeID) : null;
  const since = req.query.since ? String(req.query.since) : null;
  const limit = req.query.limit ? Number(req.query.limit) : 500;

  const conditions = [];
  const params = [];

  if (nodeID) {
    conditions.push("nodeID = ?");
    params.push(nodeID);
  }
  if (since) {
    conditions.push("datetime(timestamp) >= datetime(?)");
    params.push(since);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level,
           latitude, longitude, altitude, fix
    FROM Readings
    ${where}
    ORDER BY datetime(timestamp) DESC
    LIMIT ?
  `;
  params.push(limit);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map((r) => ({
      id: r.id,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      altitude: r.altitude ?? null,
      fix: !!r.fix,
      gps:
        r.latitude != null || r.longitude != null
          ? { latitude: r.latitude, longitude: r.longitude, altitude: r.altitude, fix: !!r.fix }
          : null,
    }));
    res.json({ data: formatted });
  });
});

// GET /api/readings/latest?limit=5
router.get("/latest", (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 5;
  const sql = `
    SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level,
           latitude, longitude, altitude, fix
    FROM Readings
    ORDER BY datetime(timestamp) DESC
    LIMIT ?
  `;
  db.all(sql, [limit], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const formatted = (rows || []).map((r) => ({
      id: r.id,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
      altitude: r.altitude ?? null,
      fix: !!r.fix,
      gps:
        r.latitude != null || r.longitude != null
          ? { latitude: r.latitude, longitude: r.longitude, altitude: r.altitude, fix: !!r.fix }
          : null,
    }));
    res.json({ data: formatted });
  });
});

module.exports = router;
