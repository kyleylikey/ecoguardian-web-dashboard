# ChirpStack Integration Quick Start

## 🎯 Purpose

This guide helps you verify and configure the ChirpStack codec to work correctly with the EcoGuardian dashboard and eco.db database.

## 🚨 Issue Found

**The original ChirpStack codec has a structural mismatch** - it wraps decoded data in an extra `data` property that the server doesn't expect.

## ✅ Solution

Use the **corrected codec** provided in this repository.

## 📁 Files Provided

| File | Purpose |
|------|---------|
| `CHIRPSTACK_CODEC_CORRECTED.js` | ✅ **Deploy this codec to ChirpStack** |
| `INTEGRATION_SUMMARY.md` | Complete system overview |
| `CODEC_VERIFICATION.md` | Detailed technical analysis |
| `TEST_PAYLOADS.md` | Test cases and examples |
| `PYTHON_SCRIPT_FIX.md` | Python script analysis |
| `test_integration.sh` | Automated test script |

## 🚀 Quick Start (3 Steps)

### Step 1: Deploy Corrected Codec

1. Open your ChirpStack application configuration
2. Navigate to the **Codec** section
3. Replace the decoder function with the code from `CHIRPSTACK_CODEC_CORRECTED.js`
4. Save and test

### Step 2: Test the Integration

```bash
# Make sure server is running
cd server
npm start

# In another terminal, run tests
./test_integration.sh
```

### Step 3: Verify

- ✅ Check dashboard shows new readings
- ✅ Check alerts appear correctly
- ✅ Verify database has data:
  ```bash
  sqlite3 server/db/eco.db "SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 5;"
  ```

## 🔍 What's Different?

### ❌ Original Codec (WRONG)

```javascript
return {
  data: {                    // Extra wrapper!
    type: "reading",
    nodeID: 2,
    data: { ... }
  }
}
```

### ✅ Corrected Codec (RIGHT)

```javascript
return {
  type: "reading",           // Direct properties
  nodeID: 2,
  data: { ... }
}
```

## 📊 Supported Packet Types

### 1. Reading Packets

**From Python:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "temp": 25.5,
  "humidity": 60,
  "co_ppm": 5.1,
  "latitude": 14.5995,
  "longitude": 120.9842,
  "altitude": 50,
  "gps_fix": true
}
```

**Codec Transforms To:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "temp_humid": {"temperature": 25.5, "humidity": 60},
    "gas": {"co_ppm": 5.1},
    "gps": {"latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true}
  }
}
```

### 2. Alert Packets

**From Python:**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}
```

**Codec Returns (unchanged structure):**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}
```

## 🗄️ Database Compatibility

### ✅ All Compatible

| Python Field | Codec Field | Database Column |
|--------------|-------------|-----------------|
| `temp` | `data.temp_humid.temperature` | `Readings.temperature` |
| `humidity` | `data.temp_humid.humidity` | `Readings.humidity` |
| `co_ppm` | `data.gas.co_ppm` | `Readings.co_level` |
| `latitude` | `data.gps.latitude` | `GPSData.latitude` |
| `longitude` | `data.gps.longitude` | `GPSData.longitude` |
| `altitude` | `data.gps.altitude` | `GPSData.altitude` |
| `gps_fix` | `data.gps.fix` | `GPSData.fix` |
| `risk_type` | `risk_type` | `Risks.risk_type` |
| `risk_level` | `risk_level` | `Risks.fire_risklvl` |
| `confidence` | `confidence` | `Risks.confidence` |

### ✅ Risk Types Match

Database accepts: `'fire'`, `'chainsaw'`, `'gunshots'`  
Python sends: `'fire'`, `'chainsaw'`, `'gunshots'` ✅

The Python script correctly maps audio detections:
- "logging" detection → sends `"chainsaw"`
- "poaching" detection → sends `"gunshots"`

## 🧪 Testing

### Manual Test

```bash
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d '{
    "received_at": "2025-12-14T15:30:00Z",
    "object": {
      "type": "reading",
      "nodeID": 2,
      "data": {
        "temp_humid": {"temperature": 25.5, "humidity": 60.2},
        "gas": {"co_ppm": 5.1},
        "gps": {"latitude": 14.5995, "longitude": 120.9842, "altitude": 50.5, "fix": true}
      }
    }
  }'
```

### Automated Tests

```bash
./test_integration.sh
```

This runs 10+ test cases covering:
- Normal readings
- All three alert types (fire, chainsaw, gunshots)
- GPS fix and no-fix scenarios
- Cooldown mechanism
- Multiple nodes

## 📈 Data Flow

```
Python Script
    ↓
[Encodes JSON to bytes]
    ↓
LoRa Transmission (LoRaWAN)
    ↓
LoRa Gateway
    ↓
ChirpStack Network Server
    ↓
[Decoder Function] ← USE CORRECTED VERSION
    ↓
HTTP Integration → POST /api/lora
    ↓
Express Server (lora.js)
    ├→ SQLite Database (eco.db)
    └→ WebSocket Broadcast
        ↓
    Dashboard (Real-time Updates)
```

## 🐛 Troubleshooting

### No Data Appearing

**Check:**
1. Server running? `curl http://localhost:3000/health`
2. Corrected codec deployed?
3. ChirpStack HTTP integration configured?
4. Check server logs

### Alerts Not Working

**Check:**
1. Python script sending correct `risk_type` values?
2. Database constraint: must be 'fire', 'chainsaw', or 'gunshots'
3. Check Risks table: `SELECT * FROM Risks ORDER BY timestamp DESC;`

### GPS Not Showing

**Check:**
1. `gps_fix` is `true` in Python payload?
2. Coordinates are not null?
3. Check GPSData table: `SELECT * FROM GPSData ORDER BY gpsID DESC;`

## 📚 Detailed Documentation

- **Full Technical Analysis**: See `CODEC_VERIFICATION.md`
- **Complete System Guide**: See `INTEGRATION_SUMMARY.md`
- **Test Examples**: See `TEST_PAYLOADS.md`
- **Python Script Details**: See `PYTHON_SCRIPT_FIX.md`

## ✨ Key Findings Summary

| Component | Status | Action Required |
|-----------|--------|-----------------|
| **ChirpStack Codec** | ❌ Broken | ✅ Deploy corrected version |
| **Database Schema** | ✅ Compatible | ❌ No changes needed |
| **Server Code** | ✅ Compatible | ❌ No changes needed |
| **Python Script** | ✅ Compatible | ❌ No changes needed |

## 🎉 Success Criteria

After deploying the corrected codec, you should see:

- ✅ Readings appear in dashboard every 10 seconds
- ✅ Temperature, humidity, CO levels display correctly
- ✅ GPS location shows on map (when fix available)
- ✅ Chainsaw alerts trigger notifications
- ✅ Gunshot alerts trigger notifications
- ✅ Fire alerts trigger notifications
- ✅ Incidents auto-resolve after 5 clean readings
- ✅ WebSocket updates in real-time
- ✅ Database stores all data correctly

## 📞 Support

If you encounter issues:

1. Check the detailed documentation files
2. Review server logs
3. Run the test script to isolate the problem
4. Verify database contents directly

## 🔒 Security Note

The corrected codec:
- ✅ Validates required fields exist
- ✅ Returns proper error messages
- ✅ Handles null/undefined values safely
- ✅ Matches database constraints

## 📝 License

This documentation is part of the EcoGuardian project.

---

**Last Updated**: 2025-12-14  
**Version**: 1.0.0  
**Compatibility**: ChirpStack v4, EcoGuardian Dashboard
