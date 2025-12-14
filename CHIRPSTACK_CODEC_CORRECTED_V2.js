// ChirpStack v4 decoder for JSON payload - VERSION 2
// ====================================================
// CORRECTED VERSION - Compatible with ChirpStack v4 requirements
//
// ChirpStack v4 behavior:
// 1. Codec MUST return an object with a 'data' property
// 2. ChirpStack unwraps the 'data' object and places its contents in req.body.object
// 3. Example: return { data: { type, nodeID, temp_humid, gas, gps } }
//    becomes { type, nodeID, temp_humid, gas, gps } in req.body.object
//
// SOLUTION: Put ALL fields (type, nodeID, sensors) inside the 'data' wrapper
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
      // Return structure wrapped in 'data' property as required by ChirpStack v4
      // ChirpStack will place the contents of 'data' in req.body.object
      return {
        data: {
          type: jsonData.type,          // ✅ At root level of data
          nodeID: jsonData.nodeID,      // ✅ At root level of data
          temp_humid: {                 // ✅ At root level of data
            temperature: jsonData.temp,
            humidity: jsonData.humidity
          },
          gas: {                        // ✅ At root level of data
            co_ppm: jsonData.co_ppm
          },
          gps: {                        // ✅ At root level of data
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
      // Return structure wrapped in 'data' property
      return {
        data: {
          type: "alert",                                                        // ✅ At root level of data
          nodeID: jsonData.nodeID,                                              // ✅ At root level of data
          risk_type: jsonData.risk_type,                                        // ✅ At root level of data
          risk_level: jsonData.risk_level !== undefined ? jsonData.risk_level : null,    // ✅ At root level of data (nullable)
          confidence: jsonData.confidence !== undefined ? jsonData.confidence : null     // ✅ At root level of data (nullable)
        }
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
// Decoder Output (wrapped in 'data'):
// {
//   data: {
//     type: "reading",
//     nodeID: 2,
//     temp_humid: { temperature: 25.5, humidity: 60 },
//     gas: { co_ppm: 5.2 },
//     gps: { latitude: 14.5995, longitude: 120.9842, altitude: 50, fix: true }
//   }
// }
//
// This will appear in ChirpStack's object field (data contents unwrapped):
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
//   data: {
//     type: "alert",
//     nodeID: 2,
//     risk_type: "chainsaw",
//     risk_level: 1,
//     confidence: 85.5
//   }
// }

// Example 3: Alert Payload (Fire)
// Input from Python: {"type":"alert","nodeID":2,"risk_type":"fire","risk_level":3,"confidence":null}
// Decoder Output:
// {
//   data: {
//     type: "alert",
//     nodeID: 2,
//     risk_type: "fire",
//     risk_level: 3,
//     confidence: null
//   }
// }
