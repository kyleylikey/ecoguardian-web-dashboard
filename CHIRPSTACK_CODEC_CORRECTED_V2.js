// ChirpStack v4 decoder for JSON payload - VERSION 2
// ====================================================
// FLAT STRUCTURE VERSION - Compatible with ChirpStack v4 behavior
//
// ChirpStack v4 behavior: When a codec returns { type, nodeID, data: {...} },
// the 'data' object gets unwrapped and its contents are placed at the root.
// This means { type, nodeID, data: { temp_humid, gas, gps } }
// becomes { temp_humid, gas, gps } in req.body.object (losing type and nodeID)
//
// SOLUTION: Return everything flat at the root level, including type and nodeID
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
      // Return FLAT structure with all fields at root level
      // ChirpStack will place these directly in req.body.object
      return {
        type: jsonData.type,          // ✅ At root level
        nodeID: jsonData.nodeID,      // ✅ At root level
        temp_humid: {                 // ✅ At root level (NOT nested under 'data')
          temperature: jsonData.temp,
          humidity: jsonData.humidity
        },
        gas: {                        // ✅ At root level
          co_ppm: jsonData.co_ppm
        },
        gps: {                        // ✅ At root level
          latitude: jsonData.latitude,
          longitude: jsonData.longitude,
          altitude: jsonData.altitude,
          fix: jsonData.gps_fix
        }
      };
    }

    // ----------------------------
    // HANDLE ALERT / RISK
    // ----------------------------
    else if (jsonData.type === "alert") {
      // Return flat structure for alerts
      return {
        type: "alert",                                                        // ✅ At root level
        nodeID: jsonData.nodeID,                                              // ✅ At root level
        risk_type: jsonData.risk_type,                                        // ✅ At root level
        risk_level: jsonData.risk_level !== undefined ? jsonData.risk_level : null,    // ✅ At root level (nullable)
        confidence: jsonData.confidence !== undefined ? jsonData.confidence : null     // ✅ At root level (nullable)
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
// Decoder Output (flat structure):
// {
//   type: "reading",
//   nodeID: 2,
//   temp_humid: { temperature: 25.5, humidity: 60 },
//   gas: { co_ppm: 5.2 },
//   gps: { latitude: 14.5995, longitude: 120.9842, altitude: 50, fix: true }
// }
//
// This will appear in ChirpStack's object field AS-IS:
// "object": {
//   "type": "reading",
//   "nodeID": 2,
//   "temp_humid": { "temperature": 25.5, "humidity": 60 },
//   "gas": { "co_ppm": 5.2 },
//   "gps": { "latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true }
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
