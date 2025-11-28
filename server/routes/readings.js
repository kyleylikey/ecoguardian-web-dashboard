const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ----------------------
// GET All Readings
// ----------------------
router.get("/", (req, res) => {
  const { nodeID, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      r.readingID,
      r.nodeID,
      r.timestamp,
      r.temperature,
      r.humidity,
      r.co_level,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix,
      sn.name AS nodeName
    FROM Readings r
    LEFT JOIN GPSData g ON r.readingID = g.readingID
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
  `;

  const params = [];

  // Filter by nodeID if provided
  if (nodeID) {
    query += " WHERE r.nodeID = ?";
    params.push(nodeID);
  }

  // Order by most recent first
  query += " ORDER BY r.readingID DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching readings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ readings: rows, count: rows.length });
  });
});

// ----------------------
// GET Single Reading by ID
// ----------------------
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      r.*,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix,
      sn.name AS nodeName
    FROM Readings r
    LEFT JOIN GPSData g ON r.readingID = g.readingID
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.readingID = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("❌ Error fetching reading:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Reading not found" });
    }
    res.json(row);
  });
});

// ----------------------
// GET Latest Reading for Each Node (Sensor Nodes Page)
// ----------------------
router.get("/latest/all", (req, res) => {
  const query = `
    SELECT 
      r.*,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix,
      sn.name AS nodeName,
      sn.status
    FROM Readings r
    INNER JOIN (
      SELECT nodeID, MAX(timestamp) as maxTime
      FROM Readings
      GROUP BY nodeID
    ) latest ON r.nodeID = latest.nodeID AND r.timestamp = latest.maxTime
    LEFT JOIN GPSData g ON r.readingID = g.readingID
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    ORDER BY r.timestamp DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching latest readings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ readings: rows, count: rows.length });
  });
});

// ----------------------
// GET Readings by Time Range
// ----------------------
router.get("/range/:nodeID", (req, res) => {
  const { nodeID } = req.params;
  const { start, end } = req.query;

  if (!start || !end) {
    return res.status(400).json({ error: "start and end timestamps required" });
  }

  const query = `
    SELECT 
      r.*,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix
    FROM Readings r
    LEFT JOIN GPSData g ON r.readingID = g.readingID
    WHERE r.nodeID = ?
      AND r.timestamp BETWEEN ? AND ?
    ORDER BY r.timestamp ASC
  `;

  db.all(query, [nodeID, start, end], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching readings by range:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ readings: rows, count: rows.length });
  });
});

// ----------------------
// GET Statistics for a Node
// ----------------------
router.get("/stats/:nodeID", (req, res) => {
  const { nodeID } = req.params;
  const { hours = 24 } = req.query;

  const query = `
    SELECT 
      COUNT(*) as totalReadings,
      AVG(temperature) as avgTemperature,
      MAX(temperature) as maxTemperature,
      MIN(temperature) as minTemperature,
      AVG(humidity) as avgHumidity,
      MAX(humidity) as maxHumidity,
      MIN(humidity) as minHumidity,
      AVG(co_level) as avgCO,
      MAX(co_level) as maxCO
    FROM Readings
    WHERE nodeID = ?
      AND timestamp >= datetime('now', '-' || ? || ' hours')
  `;

  db.get(query, [nodeID, hours], (err, row) => {
    if (err) {
      console.error("❌ Error fetching statistics:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(row);
  });
});

// ----------------------
// DELETE Old Readings (Cleanup)
// ----------------------
router.delete("/cleanup", (req, res) => {
  const { days = 90 } = req.query;

  const query = `
    DELETE FROM Readings
    WHERE timestamp < datetime('now', '-' || ? || ' days')
  `;

  db.run(query, [days], function(err) {
    if (err) {
      console.error("❌ Error cleaning up readings:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ 
      message: `Deleted readings older than ${days} days`,
      deletedCount: this.changes 
    });
  });
});

module.exports = router;