const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", (req, res) => {
  try {
    const payload = req.body?.object;
    if (!payload || !payload.type) {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    // Handle SENSOR READING payload
    if (payload.type === "reading") {
      const { nodeID, data } = payload;
      if (!nodeID || !data) {
        return res.status(400).json({ error: "nodeID and data are required" });
      }

      // Extract inner data
      const temperature = data.temp_humid?.temperature ?? null;
      const humidity = data.temp_humid?.humidity ?? null;
      const co_level = data.gas?.co_ppm ?? null;
      const gps = data.gps ?? null;

      // 1️⃣ Insert into Readings table
      const sqlReading = `
        INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level)
        VALUES (?, datetime('now', 'localtime'), ?, ?, ?)
      `;

      db.run(sqlReading, [nodeID, temperature, humidity, co_level], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const readingID = this.lastID;

        // 2️⃣ If GPS data exists, insert it
        if (gps) {
          const sqlGPS = `
            INSERT INTO GPSData (readingID, latitude, longitude, altitude, fix)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.run(
            sqlGPS,
            [readingID, gps.latitude, gps.longitude, gps.altitude, gps.fix ? 1 : 0],
            (err2) => {
              if (err2) console.error("❌ GPS insert error:", err2.message);
            }
          );
        }

        // 3️⃣ Broadcast via SSE
        db.get(
          `SELECT sensorReadingID as id, nodeID, timestamp, temperature, humidity, co_level
           FROM Readings WHERE sensorReadingID = ?`,
          [readingID],
          (err, row) => {
            if (!err && row) {
              const sseClients = req.app.locals.sseClients || [];
              const dataToSend = {
                ...row,
                gps: gps || null
              };
              const data = JSON.stringify({ type: "reading", data: dataToSend });

              sseClients.forEach((clientRes) => {
                try {
                  clientRes.write(`event: reading\n`);
                  clientRes.write(`data: ${data}\n\n`);
                } catch {
                  // ignore individual client write failures
                }
              });
            }

            return res.status(201).json({
              ok: true,
              type: "reading",
              id: readingID,
              message: "Reading inserted successfully",
            });
          }
        );
      });
    }

    // Future alert handler
    else if (payload.type === "alert") {
      return res.status(501).json({ message: "Alert handling not yet implemented" });
    }

    else {
      return res.status(400).json({ error: "Unknown message type" });
    }
  } catch (err) {
    console.error("❌ Error processing Lora message:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
