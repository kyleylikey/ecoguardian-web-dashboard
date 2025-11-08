const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.use(express.json());

/**
 * GET /api/readings
 * Returns all readings (up to 1000), joined with GPS data
 * Optional query param: ?nodeID=1
 */
router.get("/", async (req, res) => {
  const { nodeID } = req.query;

  const sql = `
    SELECT 
      r.sensorReadingID AS id,
      r.nodeID,
      r.timestamp,
      r.temperature,
      r.humidity,
      r.co_level,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix
    FROM Readings r
    LEFT JOIN GPSData g ON g.readingID = r.sensorReadingID
    ${nodeID ? "WHERE r.nodeID = ?" : ""}
    ORDER BY datetime(r.timestamp) DESC
    LIMIT 1000
  `;

  db.all(sql, nodeID ? [nodeID] : [], (err, rows) => {
    if (err) {
      console.error("❌ Failed to fetch readings:", err);
      res.status(500).json({ error: err.message });
    } else {
      const formatted = rows.map((r) => ({
        id: r.id,
        nodeID: r.nodeID,
        timestamp: r.timestamp,
        temperature: r.temperature,
        humidity: r.humidity,
        co_level: r.co_level,
        gps: r.latitude
          ? {
              latitude: r.latitude,
              longitude: r.longitude,
              altitude: r.altitude,
              fix: !!r.fix,
            }
          : null,
      }));
      res.json({ count: formatted.length, data: formatted });
    }
  });
});

/**
 * GET /api/readings/latest
 * Returns the latest reading per node (with GPS info)
 */
router.get("/latest", async (req, res) => {
  const sql = `
    SELECT 
      r.sensorReadingID AS id,
      r.nodeID,
      r.timestamp,
      r.temperature,
      r.humidity,
      r.co_level,
      g.latitude,
      g.longitude,
      g.altitude,
      g.fix
    FROM Readings r
    LEFT JOIN GPSData g ON g.readingID = r.sensorReadingID
    WHERE r.timestamp = (
      SELECT MAX(r2.timestamp)
      FROM Readings r2
      WHERE r2.nodeID = r.nodeID
    )
    ORDER BY r.nodeID ASC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("❌ Failed to fetch latest readings:", err);
      return res.status(500).json({ error: err.message });
    }

    const formatted = rows.map((r) => ({
      id: r.id,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      gps: r.latitude
        ? {
            latitude: r.latitude,
            longitude: r.longitude,
            altitude: r.altitude,
            fix: !!r.fix,
          }
        : null,
    }));

    return res.json({ count: formatted.length, data: formatted });
  });
});

module.exports = router;
