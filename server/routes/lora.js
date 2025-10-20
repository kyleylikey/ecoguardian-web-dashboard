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
        VALUES (?, datetime('now'), ?, ?, ?)
      `;

      db.run(sql, [nodeID, temperature, humidity, co_level], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        return res.status(201).json({
          ok: true,
          type: "reading",
          id: this.lastID,
          message: "Reading inserted successfully",
        });
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
