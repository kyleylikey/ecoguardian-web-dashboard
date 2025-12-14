# ChirpStack v4 Codec Structure Fix

## The Issue

ChirpStack v4 has unexpected behavior with nested codec return values. When a codec returns a structured object like:

```javascript
return {
  type: "reading",
  nodeID: 2,
  data: {
    temp_humid: { temperature: 26.1, humidity: 61.8 },
    gas: { co_ppm: 3.0 },
    gps: { latitude: null, longitude: null, altitude: null, fix: false }
  }
};
```

ChirpStack v4 **unwraps** the `data` object and places its contents at the root of the `object` field, resulting in:

```json
"object": {
  "temp_humid": { "temperature": 26.1, "humidity": 61.8 },
  "gas": { "co_ppm": 3.0 },
  "gps": { "latitude": null, "longitude": null, "altitude": null, "fix": false }
}
```

**Notice**: `type` and `nodeID` are **missing**! This causes the server to receive `undefined` for these critical fields.

## The Root Cause

ChirpStack v4's codec execution behavior:
1. Takes the codec's return value
2. If a `data` property exists, **unwraps it** and promotes its contents to root level
3. **Discards** sibling properties like `type` and `nodeID`
4. Places only the unwrapped contents in `req.body.object`

## The Solution

### V2 Codec (CHIRPSTACK_CODEC_CORRECTED_V2.js)

Return **everything flat** at the root level without a nested `data` property:

```javascript
return {
  type: "reading",          // ✅ At root level
  nodeID: 2,                // ✅ At root level
  temp_humid: {             // ✅ At root level (NOT under 'data')
    temperature: 26.1,
    humidity: 61.8
  },
  gas: {                    // ✅ At root level
    co_ppm: 3.0
  },
  gps: {                    // ✅ At root level
    latitude: null,
    longitude: null,
    altitude: null,
    fix: false
  }
};
```

This results in ChirpStack's `object` field containing:

```json
"object": {
  "type": "reading",
  "nodeID": 2,
  "temp_humid": { "temperature": 26.1, "humidity": 61.8 },
  "gas": { "co_ppm": 3.0 },
  "gps": { "latitude": null, "longitude": null, "altitude": null, "fix": false }
}
```

✅ **All fields preserved!**

### Server Update

The server now supports **both codec structures** (nested and flat):

```javascript
// Extract type, nodeID, and optional 'data' wrapper
const { type, nodeID, data } = payload;

// Support both structures:
// V1 (nested): { type, nodeID, data: { temp_humid, gas, gps } }
// V2 (flat): { type, nodeID, temp_humid, gas, gps }
const sensorData = data || payload;

// Now access sensor data consistently:
sensorData.temp_humid.temperature
sensorData.gas.co_ppm
sensorData.gps.latitude
```

## Deployment Instructions

### 1. Deploy V2 Codec to ChirpStack

1. Navigate to: **Tenant → Device Profiles → "Sensor (ABP)" → Codec tab**
2. **Completely replace** the existing codec with `CHIRPSTACK_CODEC_CORRECTED_V2.js`
3. Click **"Submit"** to save
4. **Test immediately** using ChirpStack's built-in **"Test decoder"** button:
   - Input: `{"type":"reading","nodeID":2,"temp":26.1,"humidity":61.8,"co_ppm":3.0,"latitude":null,"longitude":null,"altitude":null,"gps_fix":false}`
   - Expected output should show `type` and `nodeID` at root level
5. **Restart ChirpStack** to clear codec cache:
   ```bash
   docker-compose restart chirpstack
   # OR
   sudo systemctl restart chirpstack
   ```

### 2. Restart Server

```bash
cd server
npm start
```

### 3. Verify End-to-End

Send a packet from your sensor node and check:

**ChirpStack Events:**
```json
"object": {
  "type": "reading",  // ✅ Should be present
  "nodeID": 2,        // ✅ Should be present
  "temp_humid": {...},
  "gas": {...},
  "gps": {...}
}
```

**Server Logs:**
```
📥 Received LoRa payload: { type: 'reading', nodeID: 2, rssi: -84, snr: 11.8 }
✅ Reading saved - readingID: 16
```

✅ **Success!** `type` and `nodeID` are now defined.

## Troubleshooting

### Still seeing `type: undefined, nodeID: undefined`?

1. **Check ChirpStack codec location**: Must be in Device Profile, not Application
2. **Verify device profile**: Go to Devices → SensorNode02 → Configuration → Check "Device Profile" matches where you deployed the codec
3. **Clear browser cache**: ChirpStack UI may cache old event data
4. **Check for errors**: ChirpStack Events tab → Look for `errors` array in uplink JSON
5. **Test the codec**: Use ChirpStack's built-in test function to verify codec works in isolation

### Codec test passes but real packets still broken?

- **Restart ChirpStack**: Old codec may be cached in memory
- **Check packet encryption**: ABP credentials must match between sensor and ChirpStack
- **Verify fPort**: Codec may be configured for specific fPort (should be fPort 1)
- **Check JSON format**: Python script must send valid JSON with `type` and `nodeID` fields

## Why This Happened

ChirpStack v4 changed codec behavior compared to v3:
- **ChirpStack v3**: Codec return value → `object` field (1:1 mapping)
- **ChirpStack v4**: Codec return value → Special handling of `data` property → Unwrapped `object` field

This is likely intended for consistency with LoRaWAN standard payloads, but creates issues when you need metadata fields like `type` and `nodeID` alongside sensor data.

## Backward Compatibility

The server now supports **both** codec versions:
- ✅ V1 (nested): `{ type, nodeID, data: { temp_humid, gas, gps } }`
- ✅ V2 (flat): `{ type, nodeID, temp_humid, gas, gps }`

You can deploy V2 without changing the server code, and it will work with both structures.

## Related Files

- **CHIRPSTACK_CODEC_CORRECTED_V2.js** - Production codec (use this)
- **CHIRPSTACK_CODEC_CORRECTED.js** - Legacy codec (nested structure, doesn't work with ChirpStack v4)
- **server/routes/lora.js** - Server endpoint with dual-structure support
- **CHIRPSTACK_CODEC_DEPLOYMENT.md** - Detailed deployment troubleshooting
