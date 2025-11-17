const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", (req, res) => {
  try {
    const payload = req.body?.object;
    if (!payload) return res.status(400).json({ error: "Missing object payload" });

    // SSE helpers (must exist before any DB callbacks)
    function broadcastRiskEvent(app, eventName, riskRow) {
      try {
        const clients = app.locals.sseRiskClients || [];
        const payload = JSON.stringify({ data: riskRow });
        clients.forEach((clientRes) => {
          try {
            clientRes.write(`event: ${eventName}\n`);
            clientRes.write(`data: ${payload}\n\n`);
          } catch (e) {}
        });
      } catch (e) {
        console.warn("broadcastRiskEvent error:", e?.message || e);
      }
    }

    function broadcastReading(app, readingOrId) {
      const send = (row) => {
        try {
          const clients = app.locals.sseClients || [];
          const out = {
            id: row.id ?? row.sensorReadingID ?? null,
            sensorReadingID: row.id ?? row.sensorReadingID ?? null,
            nodeID: row.nodeID ?? row.node ?? null,
            timestamp: row.timestamp ?? new Date().toISOString(),
            temperature: row.temperature ?? null,
            humidity: row.humidity ?? null,
            co_level: row.co_level ?? null,
            latitude: row.latitude ?? null,
            longitude: row.longitude ?? null,
            altitude: row.altitude ?? null,
            fix: !!row.fix,
            gps:
              (row.latitude !== undefined && row.longitude !== undefined) || row.gps
                ? {
                    latitude: row.latitude ?? row.gps?.latitude ?? null,
                    longitude: row.longitude ?? row.gps?.longitude ?? null,
                    altitude: row.altitude ?? row.gps?.altitude ?? null,
                    fix: !!(row.fix ?? row.gps?.fix),
                  }
                : null,
          };
          const payload = JSON.stringify({ type: "reading", data: out });
          clients.forEach((clientRes) => {
            try {
              clientRes.write(`event: reading\n`);
              clientRes.write(`data: ${payload}\n\n`);
            } catch (e) {}
          });
        } catch (e) {
          console.warn("broadcastReading send error:", e?.message || e);
        }
      };

      if (readingOrId && typeof readingOrId === "object") {
        const row = readingOrId;
        if (row.latitude !== undefined || row.longitude !== undefined || row.altitude !== undefined || row.fix !== undefined) {
          return send(row);
        }
        const id = row.id ?? row.sensorReadingID ?? null;
        if (id) {
          db.get(
            `SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix FROM Readings WHERE sensorReadingID = ?`,
            [id],
            (err, fresh) => {
              if (!err && fresh) return send(fresh);
              return send(row);
            }
          );
          return;
        }
        return send(row);
      }

      if (readingOrId) {
        db.get(
          `SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix FROM Readings WHERE sensorReadingID = ?`,
          [readingOrId],
          (err, fresh) => {
            if (!err && fresh) return send(fresh);
            return;
          }
        );
      }
    }

    // Ensure per-node non-alert counters exist
    req.app.locals.nodeNonAlertCounts = req.app.locals.nodeNonAlertCounts || {};

    // Ensure SensorNode exists (create minimal row if missing)
    function ensureSensorNode(nodeID, cb) {
      if (!nodeID) return cb(new Error("missing nodeID"));
      db.get("SELECT nodeID FROM SensorNode WHERE nodeID = ?", [nodeID], (err, row) => {
        if (err) return cb(err);
        if (row) return cb(null, row);
        db.run("INSERT INTO SensorNode (nodeID, name, created_at) VALUES (?, ?, datetime('now','localtime'))", [nodeID, `node-${nodeID}`], function (insertErr) {
          if (insertErr) return cb(insertErr);
          db.get("SELECT nodeID FROM SensorNode WHERE rowid = ?", [this.lastID], (gErr, newRow) => {
            if (gErr) return cb(gErr);
            return cb(null, newRow);
          });
        });
      });
    }

    // ---------- READING path ----------
    if (payload.type === "reading") {
      const { nodeID, data } = payload;
      if (!nodeID) return res.status(400).json({ error: "nodeID required" });
      ensureSensorNode(nodeID, (nErr) => {
        if (nErr) {
          console.error("ensureSensorNode error:", nErr);
          return res.status(500).json({ error: "Failed to ensure SensorNode" });
        }

        const temperature = data?.temp_humid?.temperature ?? null;
        const humidity = data?.temp_humid?.humidity ?? null;
        const co_level = data?.gas?.co_ppm ?? null;
        const latitude = data?.gps?.latitude ?? null;
        const longitude = data?.gps?.longitude ?? null;
        const altitude = data?.gps?.altitude ?? null;
        const fix = data?.gps?.fix ? 1 : 0;

        const insertSql = `
          INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix)
          VALUES (?, datetime('now','localtime'), ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(insertSql, [nodeID, temperature, humidity, co_level, latitude, longitude, altitude, fix], function (insErr) {
          if (insErr) {
            console.error("DB insert reading error:", insErr);
            return res.status(500).json({ error: insErr.message });
          }
          const newReadingID = this.lastID;
          db.get(`SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix FROM Readings WHERE sensorReadingID = ?`, [newReadingID], (gErr, readingRow) => {
            if (gErr) {
              console.error("DB error fetching new reading:", gErr);
              return res.status(500).json({ error: gErr.message });
            }
            if (!readingRow) return res.status(201).json({ ok: true, id: newReadingID });

            // broadcast reading SSE
            broadcastReading(req.app, readingRow);

            // non-alert counter logic (auto-expire etc.) — keep existing behavior
            // ...existing non-alert handling...
            return res.status(201).json({ data: readingRow });
          });
        });
      });
      return;
    }
    // ---------- ALERT path ----------
    else if (payload.type === "alert") {
      const { nodeID, data, risk_type, risk_level = null, confidence = null, readingID = null } = payload;
      if (nodeID) req.app.locals.nodeNonAlertCounts[nodeID] = 0;
      if (!nodeID || !risk_type) return res.status(400).json({ error: "nodeID and risk_type are required for alerts" });

      ensureSensorNode(nodeID, (nErr) => {
        if (nErr) {
          console.error("ensureSensorNode error:", nErr);
          return res.status(500).json({ error: "Failed to ensure SensorNode" });
        }

        // create a new Reading (snapshot) for this alert (even subsequent ones)
        const temperature = data?.temp_humid?.temperature ?? null;
        const humidity = data?.temp_humid?.humidity ?? null;
        const co_level = data?.gas?.co_ppm ?? null;
        const latitude = data?.gps?.latitude ?? null;
        const longitude = data?.gps?.longitude ?? null;
        const altitude = data?.gps?.altitude ?? null;
        const fix = data?.gps?.fix ? 1 : 0;

        const insertReadingSql = `
          INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix)
          VALUES (?, datetime('now','localtime'), ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(insertReadingSql, [nodeID, temperature, humidity, co_level, latitude, longitude, altitude, fix], function (insErr) {
          if (insErr) {
            console.error("DB insert reading error:", insErr);
            return res.status(500).json({ error: insErr.message });
          }
          const newReadingID = this.lastID;

          // fetch the reading row to return / broadcast
          db.get(`SELECT sensorReadingID AS id, nodeID, timestamp, temperature, humidity, co_level, latitude, longitude, altitude, fix FROM Readings WHERE sensorReadingID = ?`, [newReadingID], (gErr, readingRow) => {
            if (gErr) {
              console.error("DB error fetching new reading:", gErr);
              return res.status(500).json({ error: gErr.message });
            }
            if (!readingRow) {
              // unexpected but handle gracefully
              readingRow = { id: newReadingID, nodeID, timestamp: new Date().toISOString(), temperature, humidity, co_level, latitude, longitude, altitude, fix };
            }

            // find existing unresolved alert for same node & risk_type
            db.get(`SELECT * FROM RiskDetection WHERE nodeID = ? AND risk_type = ? AND resolved = 0 ORDER BY datetime(timestamp) DESC LIMIT 1`, [nodeID, risk_type], (findErr, existing) => {
              if (findErr) {
                console.error("DB find existing incident error:", findErr);
                return res.status(500).json({ error: findErr.message });
              }

              if (existing) {
                // Subsequent alert -> update the existing risk row: latest readingID + timestamp + optionally update confidence/risk_level
                db.run(`INSERT INTO RiskDetection (readingID, confidence, risk_level, timestamp) VALUES (?, ?, ?, datetime('now','localtime')) WHERE riskID = ?`, [newReadingID, confidence, risk_level, existing.riskID], function (uErr) {
                  if (uErr) {
                    console.error("DB update RiskDetection error:", uErr);
                    // still return success for reading created
                    return res.status(201).json({ modalAction: "append", riskID: existing.riskID, reading: readingRow });
                  }
                  // broadcast update + reading
                  db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [existing.riskID], (fErr, updatedRisk) => {
                    if (fErr) {
                      console.warn("Failed to fetch updated risk:", fErr);
                      return res.status(201).json({ modalAction: "append", riskID: existing.riskID, reading: readingRow });
                    }
                    // SSE helpers (assumes broadcastRiskEvent & broadcastReading exist)
                    try { broadcastRiskEvent(req.app, "risk_updated", updatedRisk); } catch(e) {}
                    try { broadcastReading(req.app, readingRow); } catch(e) {}
                    return res.status(200).json({ modalAction: "append", riskID: existing.riskID, reading: readingRow, risk: updatedRisk });
                  });
                });
              } else {
                // First alert -> create new RiskDetection and instruct frontend to open a modal
                const sqlRisk = `INSERT INTO RiskDetection (nodeID, readingID, risk_type, risk_level, confidence, timestamp, resolved) VALUES (?, ?, ?, ?, ?, datetime('now','localtime'), 0)`;
                db.run(sqlRisk, [nodeID, newReadingID, risk_type, risk_level, confidence], function (rErr) {
                  if (rErr) {
                    console.error("DB insert RiskDetection error:", rErr);
                    return res.status(500).json({ error: rErr.message });
                  }
                  const createdRiskID = this.lastID;
                  db.get(`SELECT * FROM RiskDetection WHERE riskID = ?`, [createdRiskID], (fErr, newRiskRow) => {
                    if (fErr) {
                      console.warn("Failed to fetch new risk:", fErr);
                      return res.status(201).json({ modalAction: "open", riskID: createdRiskID, reading: readingRow });
                    }
                    try { broadcastRiskEvent(req.app, "risk_created", newRiskRow); } catch(e) {}
                    try { broadcastReading(req.app, readingRow); } catch(e) {}
                    return res.status(201).json({ modalAction: "open", riskID: createdRiskID, reading: readingRow, risk: newRiskRow });
                  });
                });
              }
            }); // end find existing
          }); // end get reading
        }); // end insert reading
      }); // end ensureSensorNode
      return;
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
