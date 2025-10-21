const express = require("express");
const router = express.Router();
const db = require("../db/db");


router.use(express.json());

// Get all readings (only necessary fields)
router.get("/", async (req, res) => {
  const sql = `
    SELECT sensorReadingID as id, nodeID, timestamp, temperature, humidity, co_level FROM Readings 
    ORDER BY datetime(timestamp) DESC
    LIMIT 1000
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ data: rows });
    }
  });
});

// Get latest reading per node
router.get("/latest", async (req, res) => {
  const sql = `
    SELECT sensorReadingID as id, nodeID, timestamp, temperature, humidity, co_level FROM Readings
    ORDER BY datetime(timestamp) DESC
    LIMIT 5
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ data: rows });
  });
});


module.exports = router;
