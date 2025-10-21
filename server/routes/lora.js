const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", (req, res) => {
  try {
    const payload = req.body?.object;

    if (!payload || !payload.type) {
      return res.status(400).json({ error: "Invalid payload format" });
    }

    if (payload.type === "reading") {
      const { nodeID, temperature, humidity, co_level } = payload;

      if (!nodeID) return res.status(400).json({ error: "nodeID required" });

      const sql = `
        INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level)
        VALUES (?, datetime('now', 'localtime'), ?, ?, ?)
      `;

      db.run(sql, [nodeID, temperature, humidity, co_level], function (err) {
        if (err) return res.status(500).json({ error: err.message });

        const insertedId = this.lastID;

        // read the actual inserted row (ensures unique id and DB timestamp)
        db.get(
          `SELECT sensorReadingID as id, nodeID, timestamp, temperature, humidity, co_level
           FROM Readings WHERE sensorReadingID = ?`,
          [insertedId],
          (err, row) => {
            if (!err && row) {
              const payloadToBroadcast = row;
              const sseClients = req.app.locals.sseClients || [];
              const data = JSON.stringify({ type: "reading", data: payloadToBroadcast });
              sseClients.forEach((clientRes) => {
                try {
                  clientRes.write(`event: reading\n`);
                  clientRes.write(`data: ${data}\n\n`);
                } catch (e) {
                  // ignore individual client errors
                }
              });
            }

            return res.status(201).json({
              ok: true,
              type: "reading",
              id: insertedId,
              message: "Reading inserted successfully",
            });
          }
        );
      });
    } 
    
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
