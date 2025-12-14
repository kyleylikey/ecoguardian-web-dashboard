const express = require("express");
const router = express.Router();
const db = require("../db/db");

router.post("/", async (req, res) => {
  try {
    const payload = req.body?.object;
    if (!payload) return res.status(400).json({ error: "Missing object payload" });

    const { type, nodeID, data } = payload;
    const timestamp = req.body.received_at || new Date().toISOString();

    // ✅ Universal RSSI/SNR extractor
    let rssi = null;
    let snr = null;

    // Try different common structures
    if (req.body.rx_metadata) {
      // TTN v3 or similar (array format)
      if (Array.isArray(req.body.rx_metadata) && req.body.rx_metadata.length > 0) {
        rssi = req.body.rx_metadata[0].rssi;
        snr = req.body.rx_metadata[0].snr || req.body.rx_metadata[0].lsnr;
      }
      // Single object format
      else if (typeof req.body.rx_metadata === 'object') {
        rssi = req.body.rx_metadata.rssi;
        snr = req.body.rx_metadata.snr || req.body.rx_metadata.lsnr;
      }
    }
    // ChirpStack format
    else if (req.body.rxInfo && Array.isArray(req.body.rxInfo) && req.body.rxInfo.length > 0) {
      rssi = req.body.rxInfo[0].rssi;
      snr = req.body.rxInfo[0].loRaSNR || req.body.rxInfo[0].snr;
    }
    // Helium format
    else if (req.body.hotspots && Array.isArray(req.body.hotspots) && req.body.hotspots.length > 0) {
      rssi = req.body.hotspots[0].rssi;
      snr = req.body.hotspots[0].snr;
    }
    // Generic metadata
    else if (req.body.metadata) {
      rssi = req.body.metadata.rssi;
      snr = req.body.metadata.snr || req.body.metadata.lsnr;
    }
    // Direct fields
    else {
      rssi = req.body.rssi;
      snr = req.body.snr || req.body.lsnr;
    }

    // If still null, check inside the payload itself
    if (rssi === null && payload.rssi !== undefined) {
      rssi = payload.rssi;
    }
    if (snr === null && (payload.snr !== undefined || payload.lsnr !== undefined)) {
      snr = payload.snr || payload.lsnr;
    }

    console.log('📥 Received LoRa payload:', { type, nodeID, rssi, snr });

    const wsClients = req.app.get('wsClients');

    // ✅ Update node's last_seen and status
    await new Promise((resolve, reject) => {
      db.run(
        `UPDATE SensorNodes 
         SET last_seen = ?, status = 'active'
         WHERE nodeID = ?`,
        [timestamp, nodeID],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // ========================================
    // HANDLE ALERTS
    // ========================================
    if (type === "alert") {
      let risks = [];
      
      if (payload.risks && Array.isArray(payload.risks)) {
        risks = payload.risks;
      } else if (payload.risk_type) {
        risks = [{
          risk_type: payload.risk_type,
          risk_level: payload.risk_level,
          confidence: payload.confidence
        }];
      }

      if (risks.length === 0) {
        return res.status(400).json({ error: "No risks provided in alert" });
      }

      console.log(`📊 Processing ${risks.length} risk(s)...`);

      // ✅ FIRST: Store the reading data from the alert
      let readingID = null;
      if (data?.temp_humid || data?.gas) {
        readingID = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level)
             VALUES (?, ?, ?, ?, ?)`,
            [
              nodeID, 
              timestamp, 
              data?.temp_humid?.temperature, 
              data?.temp_humid?.humidity, 
              data?.gas?.co_ppm
            ],
            function(err) {
              if (err) reject(err);
              else {
                console.log(`✅ Alert reading saved - readingID: ${this.lastID}`);
                resolve(this.lastID);
              }
            }
          );
        });

        // Save GPS data for reading
        if (data?.gps && readingID) {
          db.run(
            `INSERT INTO GPSData (readingID, latitude, longitude, altitude, fix)
             VALUES (?, ?, ?, ?, ?)`,
            [readingID, data.gps.latitude, data.gps.longitude, data.gps.altitude, data.gps.fix ? 1 : 0],
            (err) => {
              if (err) console.error("❌ Error saving GPS data for reading:", err);
            }
          );
        }
      }

      const processedRisks = [];

      for (const risk of risks) {
        const { risk_type, risk_level, confidence } = risk;

        // Map integer risk_level to TEXT for database compatibility
        // Database expects: 'low', 'medium', 'high'
        // Python/Codec may send: 1, 2, 3 OR 'low', 'medium', 'high'
        let fire_risklvl = null;
        if (risk_level !== null && risk_level !== undefined) {
          if (typeof risk_level === 'number') {
            // Map integer to TEXT
            const levelMap = { 1: 'low', 2: 'medium', 3: 'high' };
            fire_risklvl = levelMap[risk_level] || null;
          } else if (typeof risk_level === 'string') {
            // Already TEXT, validate it
            if (['low', 'medium', 'high'].includes(risk_level)) {
              fire_risklvl = risk_level;
            }
          }
        }

        // ========================================
        // ALL RISK TYPES - Incident-based grouping
        // ========================================
        const ongoingIncident = await new Promise((resolve, reject) => {
          db.get(
            `SELECT * FROM Risks 
             WHERE nodeID = ? 
             AND risk_type = ? 
             AND resolved_at IS NULL
             ORDER BY timestamp DESC
             LIMIT 1`,
            [nodeID, risk_type],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        const isNewIncident = !ongoingIncident;
        const incidentTimestamp = ongoingIncident ? ongoingIncident.timestamp : timestamp;

        const riskID = await new Promise((resolve, reject) => {
          db.run(
            `INSERT INTO Risks (
              nodeID, 
              readingID,
              timestamp, 
              updated_at, 
              risk_type, 
              fire_risklvl, 
              confidence, 
              cooldown_counter,
              is_incident_start
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
            [
              nodeID,
              readingID,
              incidentTimestamp,
              timestamp,
              risk_type, 
              fire_risklvl,  // Use mapped TEXT value instead of risk_level
              confidence,
              isNewIncident ? 1 : 0
            ],
            function(err) {
              if (err) reject(err);
              else {
                const emoji = risk_type === 'fire' ? '🔥' : risk_type === 'chainsaw' ? '🪚' : '🔫';
                const msg = isNewIncident 
                  ? `${emoji} NEW ${risk_type} incident started - riskID: ${this.lastID}` 
                  : `${emoji} ${risk_type} alert added to ongoing incident - riskID: ${this.lastID}`;
                console.log(msg);
                resolve(this.lastID);
              }
            }
          );
        });

        if (ongoingIncident) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE Risks 
               SET cooldown_counter = 0,
                   updated_at = ?
               WHERE riskID = ?`,
              [timestamp, ongoingIncident.riskID],
              (err) => {
                if (err) reject(err);
                else {
                  console.log(`   ↳ Reset cooldown for incident start riskID: ${ongoingIncident.riskID}`);
                  resolve();
                }
              }
            );
          });
        }

        if (data?.gps && riskID) {
          db.run(
            `INSERT INTO GPSData (riskID, latitude, longitude, altitude, fix)
             VALUES (?, ?, ?, ?, ?)`,
            [riskID, data.gps.latitude, data.gps.longitude, data.gps.altitude, data.gps.fix ? 1 : 0],
            (err) => {
              if (err) console.error("❌ Error saving GPS data for risk:", err);
            }
          );
        }

        processedRisks.push({
          riskID,
          risk_type,
          risk_level,
          confidence,
          isNewIncident,
          incidentTimestamp,
          readingID
        });
      }

      // Broadcast via WebSocket
      const wsMessage = {
        event: "risk_detected",
        timestamp,
        data: {
          nodeID,
          risks: processedRisks,
          temperature: data?.temp_humid?.temperature,
          humidity: data?.temp_humid?.humidity,
          co_level: data?.gas?.co_ppm,
          location: data?.gps,
          rssi, // ✅ Include signal data
          snr
        }
      };

      wsClients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify(wsMessage));
        }
      });

      console.log(`📤 Broadcasted ${processedRisks.length} risk(s)`);
    }
    // ========================================
    // HANDLE READINGS (cooldown for all risk types)
    // ========================================
    else if (type === "reading") {
      // Check for all unresolved incidents (all risk types)
      const activeIncidents = await new Promise((resolve, reject) => {
        db.all(
          `SELECT * FROM Risks 
           WHERE nodeID = ? 
           AND resolved_at IS NULL
           AND is_incident_start = 1
           ORDER BY timestamp DESC`,
          [nodeID],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });

      for (const incidentStart of activeIncidents) {
        const newCounter = incidentStart.cooldown_counter + 1;
        
        if (newCounter >= 5) {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE Risks 
               SET resolved_at = ?
               WHERE nodeID = ?
               AND risk_type = ?
               AND timestamp = ?
               AND resolved_at IS NULL`,
              [timestamp, nodeID, incidentStart.risk_type, incidentStart.timestamp],
              function(err) {
                if (err) reject(err);
                else {
                  const emoji = incidentStart.risk_type === 'fire' ? '🔥' : incidentStart.risk_type === 'chainsaw' ? '🪚' : '🔫';
                  console.log(`✅ ${incidentStart.risk_type} incident RESOLVED (${this.changes} alerts closed)`);
                  
                  wsClients.forEach((client) => {
                    if (client.readyState === 1) {
                      client.send(JSON.stringify({
                        event: `${incidentStart.risk_type}_resolved`,
                        timestamp,
                        data: { 
                          nodeID,
                          risk_type: incidentStart.risk_type,
                          incidentTimestamp: incidentStart.timestamp,
                          alertsResolved: this.changes
                        }
                      }));
                    }
                  });
                  
                  resolve();
                }
              }
            );
          });
        } else {
          await new Promise((resolve, reject) => {
            db.run(
              `UPDATE Risks 
               SET cooldown_counter = ?,
                   updated_at = ?
               WHERE riskID = ?`,
              [newCounter, timestamp, incidentStart.riskID],
              (err) => {
                if (err) reject(err);
                else {
                  const emoji = incidentStart.risk_type === 'fire' ? '🔥' : incidentStart.risk_type === 'chainsaw' ? '🪚' : '🔫';
                  console.log(`${emoji} ${incidentStart.risk_type} incident cooldown: ${newCounter}/5`);
                  
                  wsClients.forEach((client) => {
                    if (client.readyState === 1) {
                      client.send(JSON.stringify({
                        event: `${incidentStart.risk_type}_cooldown_update`,
                        timestamp,
                        data: { 
                          nodeID,
                          risk_type: incidentStart.risk_type,
                          cooldown_counter: newCounter,
                          incidentTimestamp: incidentStart.timestamp
                        }
                      }));
                    }
                  });
                  
                  resolve();
                }
              }
            );
          });
        }
      }

      // Always insert reading
      const readingID = await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO Readings (nodeID, timestamp, temperature, humidity, co_level)
           VALUES (?, ?, ?, ?, ?)`,
          [nodeID, timestamp, data?.temp_humid?.temperature, data?.temp_humid?.humidity, data?.gas?.co_ppm],
          function(err) {
            if (err) reject(err);
            else {
              console.log(`✅ Reading saved - readingID: ${this.lastID}`);
              resolve(this.lastID);
            }
          }
        );
      });

      if (data?.gps && readingID) {
        db.run(
          `INSERT INTO GPSData (readingID, latitude, longitude, altitude, fix)
           VALUES (?, ?, ?, ?, ?)`,
          [readingID, data.gps.latitude, data.gps.longitude, data.gps.altitude, data.gps.fix ? 1 : 0],
          (err) => {
            if (err) console.error("❌ Error saving GPS data:", err);
          }
        );
      }

      // Broadcast reading with signal data
      wsClients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            event: "new_reading",
            timestamp,
            data: {
              readingID,
              nodeID,
              temperature: data?.temp_humid?.temperature,
              humidity: data?.temp_humid?.humidity,
              co_level: data?.gas?.co_ppm,
              location: data?.gps,
              rssi, // ✅ Include signal data
              snr
            }
          }));
        }
      });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("❌ Error processing LoRa message:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

// real-time data pipeline: LoRa Gateway → Server → Database + WebSocket → Dashboard