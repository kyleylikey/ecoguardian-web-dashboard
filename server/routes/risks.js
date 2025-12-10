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
// NEW: GET Fire Incidents (Grouped) - DEPRECATED, use /incidents/:risk_type instead
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
// NEW: GET Incidents by Risk Type (Grouped) - Supports all risk types
// ----------------------
router.get("/incidents/:risk_type", (req, res) => {
  const { risk_type } = req.params;
  const { nodeID, resolved } = req.query;

  // Validate risk_type
  if (!['fire', 'chainsaw', 'gunshots'].includes(risk_type)) {
    return res.status(400).json({ error: "Invalid risk_type. Must be 'fire', 'chainsaw', or 'gunshots'" });
  }

  // Get all incident starts for the specified risk type
  let query = `
    SELECT 
      r.timestamp as incidentTimestamp,
      r.nodeID,
      r.risk_type,
      r.cooldown_counter,
      r.resolved_at,
      r.updated_at,
      sn.name AS nodeName,
      COUNT(*) as alertCount,
      MAX(r.fire_risklvl) as maxRiskLevel,
      AVG(r.confidence) as avgConfidence
    FROM Risks r
    LEFT JOIN SensorNodes sn ON r.nodeID = sn.nodeID
    WHERE r.risk_type = ?
      AND r.is_incident_start = 1
  `;

  const params = [risk_type];

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
      console.error(`❌ Error fetching ${risk_type} incidents:`, err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ incidents: rows, count: rows.length });
  });
});

// ----------------------
// NEW: GET All Alerts for a Fire Incident - DEPRECATED, use /incidents/:risk_type/:timestamp instead
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
// NEW: GET All Alerts for a Specific Incident (all risk types)
// ----------------------
router.get("/incidents/:risk_type/:timestamp", (req, res) => {
  const { risk_type, timestamp } = req.params;
  const { nodeID } = req.query;

  // Validate risk_type
  if (!['fire', 'chainsaw', 'gunshots'].includes(risk_type)) {
    return res.status(400).json({ error: "Invalid risk_type. Must be 'fire', 'chainsaw', or 'gunshots'" });
  }

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
    AND r.risk_type = ?
    AND r.timestamp = ?
    ORDER BY r.updated_at ASC
  `;

  db.all(query, [nodeID, risk_type, timestamp], (err, rows) => {
    if (err) {
      console.error(`❌ Error fetching ${risk_type} incident alerts:`, err);
      return res.status(500).json({ error: "Database error" });
    }

    console.log(`✅ Found ${rows.length} alerts for ${risk_type} incident at ${timestamp}`);
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
      SUM(CASE WHEN risk_type = 'chainsaw' THEN 1 ELSE 0 END) as chainsawAlerts,
      SUM(CASE WHEN risk_type = 'chainsaw' AND is_incident_start = 1 THEN 1 ELSE 0 END) as chainsawIncidents,
      SUM(CASE WHEN risk_type = 'gunshots' THEN 1 ELSE 0 END) as gunshotAlerts,
      SUM(CASE WHEN risk_type = 'gunshots' AND is_incident_start = 1 THEN 1 ELSE 0 END) as gunshotIncidents,
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
      SUM(CASE WHEN risk_type = 'chainsaw' THEN 1 ELSE 0 END) as chainsawAlerts,
      SUM(CASE WHEN risk_type = 'chainsaw' AND is_incident_start = 1 THEN 1 ELSE 0 END) as chainsawIncidents,
      SUM(CASE WHEN risk_type = 'gunshots' THEN 1 ELSE 0 END) as gunshotAlerts,
      SUM(CASE WHEN risk_type = 'gunshots' AND is_incident_start = 1 THEN 1 ELSE 0 END) as gunshotIncidents,
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

      // Resolve ALL alerts in the incident (for all risk types)
      db.run(
        `UPDATE Risks 
         SET resolved_at = ?
         WHERE nodeID = ?
         AND risk_type = ?
         AND timestamp = ?
         AND resolved_at IS NULL`,
        [resolvedAt, risk.nodeID, risk.risk_type, risk.timestamp],
        function (err) {
          if (err) {
            console.error("❌ Error resolving incident:", err);
            return res.status(500).json({ error: "Database error" });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: "No active risks found to resolve" });
          }

          console.log(`✅ ${risk.risk_type} incident resolved (${this.changes} alerts) at ${resolvedAt}`);

          // Broadcast via WebSocket
          const wsClients = req.app.get('wsClients');
          wsClients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                event: `${risk.risk_type}_resolved_manual`,
                timestamp: resolvedAt,
                data: {
                  nodeID: risk.nodeID,
                  risk_type: risk.risk_type,
                  incidentTimestamp: risk.timestamp,
                  alertsResolved: this.changes
                }
              }));
            }
          });

          res.json({
            message: `${risk.risk_type} incident resolved`,
            risk_type: risk.risk_type,
            alertsResolved: this.changes,
            resolvedAt
          });
        }
      );
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