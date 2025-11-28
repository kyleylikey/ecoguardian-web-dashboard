const express = require("express");
const router = express.Router();
const db = require("../db/db");

// ----------------------
// GET All Risks
// ----------------------
router.get("/", (req, res) => {
  const { nodeID, risk_type, resolved, limit = 100, offset = 0 } = req.query;

  let query = `
    SELECT 
      r.riskID,
      r.nodeID,
      r.readingID,
      r.timestamp,
      r.updated_at,
      r.risk_type,
      r.fire_risklvl,
      r.confidence,
      r.cooldown_counter,
      r.resolved_at,
      r.is_incident_start,
      sn.name AS nodeName,
      sn.status AS nodeStatus,
      rd.temperature,
      rd.humidity,
      rd.co_level
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    LEFT JOIN Readings rd ON r.readingID = rd.readingID
    WHERE 1=1
  `;

  const params = [];

  // Filter by nodeID if provided
  if (nodeID) {
    query += " AND r.nodeID = ?";
    params.push(nodeID);
  }

  // Filter by risk type if provided
  if (risk_type) {
    query += " AND r.risk_type = ?";
    params.push(risk_type);
  }

  // Filter by resolved status
  if (resolved !== undefined) {
    if (resolved === 'true' || resolved === '1') {
      query += " AND r.resolved_at IS NOT NULL";
    } else if (resolved === 'false' || resolved === '0') {
      query += " AND r.resolved_at IS NULL";
    }
  }

  // Order by most recent first
  query += " ORDER BY r.riskID DESC LIMIT ? OFFSET ?";
  params.push(parseInt(limit), parseInt(offset));

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching risks:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ risks: rows, count: rows.length });
  });
});

// ----------------------
// GET Single Risk by ID
// ----------------------
router.get("/:id", (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      r.*,
      sn.name AS nodeName,
      sn.status AS nodeStatus,
      sn.description AS nodeDescription
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.riskID = ?
  `;

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error("❌ Error fetching risk:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!row) {
      return res.status(404).json({ error: "Risk not found" });
    }
    res.json(row);
  });
});

// ----------------------
// GET Active/Unresolved Risks
// ----------------------
router.get("/active/all", (req, res) => {
  const query = `
    SELECT 
      r.*,
      sn.name AS nodeName,
      sn.status AS nodeStatus
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.resolved_at IS NULL
    ORDER BY r.timestamp DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching active risks:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ risks: rows, count: rows.length });
  });
});

// ----------------------
// NEW: GET Fire Incidents (Grouped)
// ----------------------
router.get("/incidents/fire", (req, res) => {
  const { nodeID, resolved } = req.query;

  // Get all fire incident starts
  let query = `
    SELECT 
      r.timestamp as incidentTimestamp,
      r.nodeID,
      r.cooldown_counter,
      r.resolved_at,
      r.updated_at,
      sn.name AS nodeName,
      COUNT(*) as alertCount,
      MAX(r.fire_risklvl) as maxRiskLevel
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.risk_type = 'fire'
      AND r.is_incident_start = 1
  `;

  const params = [];

  if (nodeID) {
    query += " AND r.nodeID = ?";
    params.push(nodeID);
  }

  if (resolved !== undefined) {
    if (resolved === 'true' || resolved === '1') {
      query += " AND r.resolved_at IS NOT NULL";
    } else if (resolved === 'false' || resolved === '0') {
      query += " AND r.resolved_at IS NULL";
    }
  }

  query += " GROUP BY r.timestamp, r.nodeID ORDER BY r.timestamp DESC";

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error("❌ Error fetching fire incidents:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ incidents: rows, count: rows.length });
  });
});

// ----------------------
// NEW: GET All Alerts for a Fire Incident
// ----------------------
router.get("/incidents/fire/:timestamp", (req, res) => {
  const { timestamp } = req.params;
  const { nodeID } = req.query;

  if (!nodeID) {
    return res.status(400).json({ error: "nodeID query parameter is required" });
  }

  const query = `
    SELECT 
      r.riskID,
      r.nodeID,
      r.readingID,
      r.timestamp,
      r.updated_at,
      r.risk_type,
      r.fire_risklvl,
      r.confidence,
      r.cooldown_counter,
      r.resolved_at,
      r.is_incident_start,
      sn.name AS nodeName,
      sn.status AS nodeStatus,
      rd.temperature,
      rd.humidity,
      rd.co_level
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    LEFT JOIN Readings rd ON r.readingID = rd.readingID
    WHERE r.nodeID = ?
    AND r.risk_type = 'fire'
    AND r.timestamp = ?
    ORDER BY r.updated_at ASC
  `;

  db.all(query, [nodeID, timestamp], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching fire incident alerts:", err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log(`✅ Found ${rows.length} alerts for fire incident at ${timestamp}`);
    res.json({ alerts: rows, count: rows.length });
  });
});

// ----------------------
// GET Risks by Time Range
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
      sn.name AS nodeName
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.nodeID = ?
      AND r.timestamp BETWEEN ? AND ?
    ORDER BY r.timestamp ASC
  `;

  db.all(query, [nodeID, start, end], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching risks by range:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ risks: rows, count: rows.length });
  });
});

// ----------------------
// GET Risk Statistics
// ----------------------
router.get("/stats/summary", (req, res) => {
  const { hours = 24 } = req.query;

  const query = `
    SELECT 
      COUNT(*) as totalRisks,
      SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as activeRisks,
      SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolvedRisks,
      SUM(CASE WHEN risk_type = 'fire' THEN 1 ELSE 0 END) as fireAlerts,
      SUM(CASE WHEN risk_type = 'fire' AND is_incident_start = 1 THEN 1 ELSE 0 END) as fireIncidents,
      SUM(CASE WHEN risk_type = 'chainsaw' THEN 1 ELSE 0 END) as chainsawRisks,
      SUM(CASE WHEN risk_type = 'gunshots' THEN 1 ELSE 0 END) as gunshotRisks,
      SUM(CASE WHEN fire_risklvl = 'high' THEN 1 ELSE 0 END) as highRiskFires,
      SUM(CASE WHEN fire_risklvl = 'medium' THEN 1 ELSE 0 END) as mediumRiskFires,
      SUM(CASE WHEN fire_risklvl = 'low' THEN 1 ELSE 0 END) as lowRiskFires
    FROM Risks
    WHERE timestamp >= datetime('now', '-' || ? || ' hours')
  `;

  db.get(query, [hours], (err, row) => {
    if (err) {
      console.error("❌ Error fetching risk statistics:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(row);
  });
});

// ----------------------
// GET Risk Statistics by Node
// ----------------------
router.get("/stats/:nodeID", (req, res) => {
  const { nodeID } = req.params;
  const { hours = 24 } = req.query;

  const query = `
    SELECT 
      COUNT(*) as totalRisks,
      SUM(CASE WHEN resolved_at IS NULL THEN 1 ELSE 0 END) as activeRisks,
      SUM(CASE WHEN resolved_at IS NOT NULL THEN 1 ELSE 0 END) as resolvedRisks,
      SUM(CASE WHEN risk_type = 'fire' THEN 1 ELSE 0 END) as fireAlerts,
      SUM(CASE WHEN risk_type = 'fire' AND is_incident_start = 1 THEN 1 ELSE 0 END) as fireIncidents,
      SUM(CASE WHEN risk_type = 'chainsaw' THEN 1 ELSE 0 END) as chainsawRisks,
      SUM(CASE WHEN risk_type = 'gunshots' THEN 1 ELSE 0 END) as gunshotRisks,
      AVG(CASE WHEN confidence IS NOT NULL THEN confidence ELSE NULL END) as avgConfidence
    FROM Risks
    WHERE nodeID = ?
      AND timestamp >= datetime('now', '-' || ? || ' hours')
  `;

  db.get(query, [nodeID, hours], (err, row) => {
    if (err) {
      console.error("❌ Error fetching node risk statistics:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(row);
  });
});

// ----------------------
// PATCH Resolve Risk (Mark as resolved)
// ----------------------
router.patch("/:id/resolve", (req, res) => {
  const { id } = req.params;
  
  // ✅ Use server's current timestamp
  const resolvedAt = new Date().toISOString();

  // First, get the risk details to know if it's a fire incident
  db.get(
    `SELECT nodeID, timestamp, risk_type FROM Risks WHERE riskID = ?`,
    [id],
    (err, risk) => {
      if (err) {
        console.error("❌ Error fetching risk:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!risk) {
        return res.status(404).json({ error: "Risk not found" });
      }

      // If it's a fire risk, resolve ALL alerts in the incident
      if (risk.risk_type === "fire") {
        db.run(
          `UPDATE Risks 
           SET resolved_at = ?
           WHERE nodeID = ?
           AND risk_type = 'fire'
           AND timestamp = ?
           AND resolved_at IS NULL`,
          [resolvedAt, risk.nodeID, risk.timestamp],
          function (err) {
            if (err) {
              console.error("❌ Error resolving fire incident:", err);
              return res.status(500).json({ error: "Database error" });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "No active risks found to resolve" });
            }

            console.log(`✅ Fire incident resolved (${this.changes} alerts) at ${resolvedAt}`);

            // Broadcast via WebSocket
            const wsClients = req.app.get('wsClients');
            wsClients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({
                  event: "fire_resolved_manual",
                  timestamp: resolvedAt,
                  data: {
                    nodeID: risk.nodeID,
                    incidentTimestamp: risk.timestamp,
                    alertsResolved: this.changes
                  }
                }));
              }
            });

            res.json({
              message: "Fire incident resolved",
              alertsResolved: this.changes,
              resolvedAt
            });
          }
        );
      } else {
        // For chainsaw/gunshots, resolve single risk
        db.run(
          `UPDATE Risks 
           SET resolved_at = ?
           WHERE riskID = ?`,
          [resolvedAt, id],
          function (err) {
            if (err) {
              console.error("❌ Error resolving risk:", err);
              return res.status(500).json({ error: "Database error" });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: "Risk not found or already resolved" });
            }

            console.log(`✅ Risk ${id} (${risk.risk_type}) resolved at ${resolvedAt}`);

            // Broadcast via WebSocket
            const wsClients = req.app.get('wsClients');
            wsClients.forEach((client) => {
              if (client.readyState === 1) {
                client.send(JSON.stringify({
                  event: "risk_resolved",
                  timestamp: resolvedAt,
                  data: {
                    riskID: id,
                    risk_type: risk.risk_type,
                    resolvedAt
                  }
                }));
              }
            });

            res.json({
              message: "Risk resolved",
              riskID: id,
              resolvedAt
            });
          }
        );
      }
    }
  );
});

// ----------------------
// DELETE Old Resolved Risks (Cleanup)
// ----------------------
router.delete("/cleanup", (req, res) => {
  const { days = 90 } = req.query;

  const query = `
    DELETE FROM Risks
    WHERE resolved_at IS NOT NULL
      AND resolved_at < datetime('now', '-' || ? || ' days')
  `;

  db.run(query, [days], function(err) {
    if (err) {
      console.error("❌ Error cleaning up risks:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ 
      message: `Deleted resolved risks older than ${days} days`,
      deletedCount: this.changes 
    });
  });
});

module.exports = router;