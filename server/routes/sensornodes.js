const express = require("express");
const router = express.Router();
const db = require("../db/db");



// ----------------------
// GET All Sensor Nodes (with connection status)
// ----------------------
router.get("/", (req, res) => {
  const query = `
    SELECT 
      nodeID,
      name,
      description,
      status,
      last_seen
    FROM SensorNodes
    ORDER BY nodeID ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching sensor nodes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    
    // Note: RSSI/SNR are NOT stored in DB, they're passed via WebSocket
    // Connection status will be computed in frontend from live data
    res.json({ nodes: rows, count: rows.length });
  });
});

// ----------------------
// GET Single Sensor Node
// ----------------------
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      nodeID,
      name,
      description,
      status,
      last_seen
    FROM SensorNodes
    WHERE nodeID = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("❌ Error fetching sensor node:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Sensor node not found" });
    }
    res.json(row);
  });
});

// ----------------------
// POST Create New Sensor Node
// ----------------------
router.post("/", (req, res) => {
  const { name, description, status = "inactive" } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const query = `
    INSERT INTO SensorNodes (name, description, status, last_seen)
    VALUES (?, ?, ?, NULL)
  `;

  db.run(query, [name, description, status], function(err) {
    if (err) {
      console.error("❌ Error creating sensor node:", err);
      return res.status(500).json({ error: "Database error" });
    }

    res.status(201).json({
      message: "Sensor node created",
      nodeID: this.lastID,
    });
  });
});

// ----------------------
// PATCH Update Sensor Node
// ----------------------
router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { name, description, status } = req.body;

  const updates = [];
  const params = [];

  if (name !== undefined) {
    updates.push("name = ?");
    params.push(name);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    params.push(description);
  }
  if (status !== undefined) {
    updates.push("status = ?");
    params.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: "No fields to update" });
  }

  params.push(id);

  const query = `
    UPDATE SensorNodes
    SET ${updates.join(", ")}
    WHERE nodeID = ?
  `;

  db.run(query, params, function(err) {
    if (err) {
      console.error("❌ Error updating sensor node:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Sensor node not found" });
    }

    res.json({ message: "Sensor node updated", nodeID: id });
  });
});

// ----------------------
// ✅ DELETE Sensor Node (with validation)
// ----------------------
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const { lastSeen } = req.query;

  // Validate deletion criteria
  if (lastSeen) {
    const lastSeenDate = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;

    // Can delete if node has been inactive for 10+ minutes
    const canDelete = diffMinutes >= 10;

    if (!canDelete) {
      return res.status(403).json({ 
        error: "Cannot delete node",
        reason: "Node must be inactive for at least 10 minutes"
      });
    }
  }
  // If no last_seen, allow deletion (node was never active)

  const query = `DELETE FROM SensorNodes WHERE nodeID = ?`;

  db.run(query, [id], function(err) {
    if (err) {
      console.error("❌ Error deleting sensor node:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: "Sensor node not found" });
    }

    res.json({ message: "Sensor node deleted", nodeID: id });
  });
});

// ----------------------
// GET Latest Reading per Node (for dashboard)
// ----------------------
router.get("/latest/readings", (req, res) => {
  const query = `
    SELECT 
      sn.nodeID,
      sn.name,
      sn.status,
      sn.last_seen,
      r.readingID,
      r.timestamp,
      r.temperature,
      r.humidity,
      r.co_level
    FROM SensorNodes sn
    LEFT JOIN (
      SELECT 
        nodeID,
        readingID,
        timestamp,
        temperature,
        humidity,
        co_level,
        ROW_NUMBER() OVER (PARTITION BY nodeID ORDER BY timestamp DESC) as rn
      FROM Readings
    ) r ON sn.nodeID = r.nodeID AND r.rn = 1
    ORDER BY sn.nodeID ASC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching latest readings per node:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ nodes: rows, count: rows.length });
  });
});

module.exports = router;