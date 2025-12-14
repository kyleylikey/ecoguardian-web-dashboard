// ChirpStack v4 decoder for JSON payload
// ==========================================
// CORRECTED VERSION - Compatible with eco.db and dashboard
//
// This decoder matches the server expectations in server/routes/lora.js
// The server expects: { type, nodeID, data } at the root of req.body.object
//
// Python sensor script sends JSON like:
// - Reading: {"type": "reading", "nodeID": 2, "temp": 25.5, "humidity": 60, ...}
// - Alert: {"type": "alert", "nodeID": 2, "risk_type": "chainsaw", "risk_level": 1, "confidence": 85.5}
//
function decodeUplink(input) {
  try {
    // Convert bytes to string
    var jsonString = String.fromCharCode.apply(null, input.bytes);

    // Parse JSON
    var jsonData = JSON.parse(jsonString);

    // Ensure type exists
    if (!jsonData.type) {
      return { errors: ["Missing 'type' field in payload"] };
    }

    // ----------------------------
    // HANDLE SENSOR READINGS
    // ----------------------------
    if (jsonData.type === "reading") {
      // Return data structure that matches server expectations
      // Server does: const { type, nodeID, data } = payload;
      return {
        type: jsonData.type,          // ✅ At root level
        nodeID: jsonData.nodeID,      // ✅ At root level
        data: {                       // ✅ At root level with nested sensor data
          temp_humid: {
            temperature: jsonData.temp,
            humidity: jsonData.humidity
          },
          gas: {
            co_ppm: jsonData.co_ppm
          },
          gps: {
            latitude: jsonData.latitude,
            longitude: jsonData.longitude,
            altitude: jsonData.altitude,
            fix: jsonData.gps_fix
          }
        }
      };
    }

    // ----------------------------
    // HANDLE ALERT / RISK
    // ----------------------------
    else if (jsonData.type === "alert") {
      // Return flat structure for alerts
      // Server checks: payload.risk_type, payload.risk_level, payload.confidence
      return {
        type: "alert",                              // ✅ At root level
        nodeID: jsonData.nodeID,                    // ✅ At root level
        risk_type: jsonData.risk_type,              // ✅ At root level
        risk_level: jsonData.risk_level ?? null,    // ✅ At root level (nullable)
        confidence: jsonData.confidence ?? null     // ✅ At root level (nullable)
      };
    }

    // ----------------------------
    // UNKNOWN TYPE
    // ----------------------------
    else {
      return {
        errors: ["Unknown payload type: " + jsonData.type]
      };
    }

  } catch (err) {
    return {
      errors: ["Failed to decode JSON: " + err.message]
    };
  }
}

// ==========================================
// TESTING EXAMPLES
// ==========================================

// Example 1: Reading Payload
// Input from Python: {"type":"reading","nodeID":2,"temp":25.5,"humidity":60,"co_ppm":5.2,"latitude":14.5995,"longitude":120.9842,"altitude":50,"gps_fix":true}
// Decoder Output:
// {
//   type: "reading",
//   nodeID: 2,
//   data: {
//     temp_humid: { temperature: 25.5, humidity: 60 },
//     gas: { co_ppm: 5.2 },
//     gps: { latitude: 14.5995, longitude: 120.9842, altitude: 50, fix: true }
//   }
// }

// Example 2: Alert Payload (Chainsaw)
// Input from Python: {"type":"alert","nodeID":2,"risk_type":"chainsaw","risk_level":1,"confidence":85.5}
// Decoder Output:
// {
//   type: "alert",
//   nodeID: 2,
//   risk_type: "chainsaw",
//   risk_level: 1,
//   confidence: 85.5
// }

// Example 3: Alert Payload (Fire)
// Input from Python: {"type":"alert","nodeID":2,"risk_type":"fire","risk_level":3,"confidence":null}
// Decoder Output:
// {
//   type: "alert",
//   nodeID: 2,
//   risk_type: "fire",
//   risk_level: 3,
//   confidence: null
// }
