const express = require("express");
const router = express.Router();
const db = require("../db/db");


router.use(express.json());

// Get all readings (only necessary fields)
router.get("/", async (req, res) => {
  const sql = `
    SELECT 
      timestamp, 
      nodeID, 
      temperature, 
      humidity, 
      co_level 
    FROM Readings 
    ORDER BY timestamp DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ count: rows.length, data: rows });
    }
  });
});

// Get latest reading per node
router.get("/latest", async (req, res) => {
  const sql = `
    SELECT r.timestamp, r.nodeID, r.temperature, r.humidity, r.co_level
    FROM Readings r
    INNER JOIN (
      SELECT nodeID, MAX(timestamp) as max_time
      FROM Readings
      GROUP BY nodeID
    ) latest
    ON r.nodeID = latest.nodeID AND r.timestamp = latest.max_time
    ORDER BY r.nodeID
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ count: rows.length, data: rows });
    }
  });
});

// Insert new reading
router.post("/", async (req, res) => {
  const { nodeID, timestamp, temperature, humidity, co_level, battery_level } = req.body;

  if (!nodeID || !timestamp) {
    return res.status(400).json({ error: "nodeID and timestamp are required" });
  }

  const sql = `
    INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level, battery_level)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [nodeID, timestamp, temperature, humidity, co_level, battery_level], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

module.exports = router;
