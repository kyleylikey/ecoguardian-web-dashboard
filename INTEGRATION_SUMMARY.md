# ChirpStack Integration Summary

## Executive Summary

✅ **Database Schema**: Fully compatible, no changes needed
✅ **Server Code**: Fully compatible, no changes needed  
✅ **Python Script**: Risk type mapping is correct
❌ **ChirpStack Codec**: Structural issue found - corrected version provided

## Quick Start

### 1. Update ChirpStack Codec (REQUIRED)

In your ChirpStack application configuration, replace the current decoder with the corrected version from `CHIRPSTACK_CODEC_CORRECTED.js`.

**Key change**: The decoder now returns data at the root level instead of wrapping it in an extra `data` property.

### 2. Test the Integration

Use the test payloads in `TEST_PAYLOADS.md` or run:

```bash
chmod +x test_integration.sh
./test_integration.sh
```

### 3. Verify Data Flow

Check that:
- Readings appear in the dashboard
- Alerts trigger notifications
- Database stores data correctly
- WebSocket updates work in real-time

## Detailed Analysis

### What Was Wrong

**Original Codec Output:**
```javascript
{
  data: {           // ❌ Extra wrapper
    type: "reading",
    nodeID: 2,
    data: { ... }
  }
}
```

**Server Expectation:**
```javascript
const payload = req.body?.object;
const { type, nodeID, data } = payload;  // Expects fields at root
```

This mismatch caused `type`, `nodeID`, and `data` to be `undefined`, breaking the entire pipeline.

### What's Correct Now

**Corrected Codec Output:**
```javascript
{
  type: "reading",    // ✅ At root level
  nodeID: 2,          // ✅ At root level
  data: { ... }       // ✅ At root level
}
```

This matches exactly what the server expects.

## Data Flow Architecture

```
┌─────────────────┐
│  Python Script  │
│  (Sensor Node)  │
└────────┬────────┘
         │ Sends JSON via LoRaWAN
         ↓
┌─────────────────┐
│   LoRa Gateway  │
└────────┬────────┘
         │ Forwards to ChirpStack
         ↓
┌─────────────────┐
│   ChirpStack    │
│   + Codec       │
└────────┬────────┘
         │ HTTP POST to /api/lora
         │ Body: { object: <decoded_data> }
         ↓
┌─────────────────┐
│  Express Server │
│  (lora.js)      │
└────────┬────────┘
         │
         ├─→ Stores in SQLite (eco.db)
         │   - Readings table
         │   - Risks table
         │   - GPSData table
         │   - SensorNodes table
         │
         └─→ Broadcasts via WebSocket
             - Real-time updates to dashboard
```

## Database Schema Details

### Readings Table
```sql
CREATE TABLE Readings (
  readingID INTEGER PRIMARY KEY,
  nodeID INTEGER,
  timestamp DATETIME,
  temperature REAL,      -- From data.temp_humid.temperature
  humidity REAL,         -- From data.temp_humid.humidity
  co_level INTEGER       -- From data.gas.co_ppm
)
```

### Risks Table
```sql
CREATE TABLE Risks (
  riskID INTEGER PRIMARY KEY,
  nodeID INTEGER NOT NULL,
  timestamp DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  risk_type TEXT CHECK(risk_type IN ('fire','chainsaw','gunshots')),
  fire_risklvl TEXT,     -- Stores risk_level from alert
  confidence REAL,       -- From audio detection (nullable)
  cooldown_counter INTEGER DEFAULT 0,
  resolved_at DATETIME,
  is_incident_start BOOLEAN DEFAULT 0
)
```

### GPSData Table
```sql
CREATE TABLE GPSData (
  gpsID INTEGER PRIMARY KEY,
  readingID INTEGER,
  riskID INTEGER,
  latitude REAL,
  longitude REAL,
  altitude REAL,
  fix BOOLEAN
)
```

## Python Script Behavior

### Reading Packets (every 10 seconds)
```python
{
  "type": "reading",
  "nodeID": 2,
  "temp": 25.5,
  "humidity": 60.2,
  "co_ppm": 5.1,
  "latitude": 14.5995,
  "longitude": 120.9842,
  "altitude": 50.5,
  "gps_fix": true
}
```

### Alert Packets (when threshold met)

**Chainsaw Alert (audio detection):**
```python
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",  # From check_audio_persistence()
  "risk_level": 1,
  "confidence": 87.3
}
```

**Gunshot Alert (audio detection):**
```python
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "gunshots",  # From check_audio_persistence()
  "risk_level": 2,
  "confidence": 91.8
}
```

**Fire Alert (sensor thresholds):**
```python
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "fire",
  "risk_level": 3,
  "confidence": null  # No confidence for sensor-based detection
}
```

### Alert Conditions

**Fire Alert Triggered When ALL Are True:**
- Temperature > 30°C
- Humidity < 60%
- CO PPM > 10

**Audio Alert Triggered When:**
- "logging" or "poaching" detected in 30% of last 10 seconds (3 out of 10)
- Confidence >= 60%
- Mapped to "chainsaw" or "gunshots" respectively

## Codec Mapping Details

### Reading Packet Transformation

**Python → Codec → Server:**

```
Python sends:
{
  "type": "reading",
  "nodeID": 2,
  "temp": 25.5,          ─┐
  "humidity": 60.2,       ├─→ Codec groups into temp_humid
  "co_ppm": 5.1,         ─┘
  "latitude": 14.5995,   ─┐
  "longitude": 120.9842,  ├─→ Codec groups into gps
  "altitude": 50.5,       │
  "gps_fix": true        ─┘
}

Codec returns:
{
  type: "reading",
  nodeID: 2,
  data: {
    temp_humid: {
      temperature: 25.5,
      humidity: 60.2
    },
    gas: {
      co_ppm: 5.1
    },
    gps: {
      latitude: 14.5995,
      longitude: 120.9842,
      altitude: 50.5,
      fix: true
    }
  }
}

Server processes:
- Stores in Readings: (2, timestamp, 25.5, 60.2, 5.1)
- Stores in GPSData: (readingID, 14.5995, 120.9842, 50.5, 1)
- Broadcasts via WebSocket
- Updates node last_seen to 'active'
```

### Alert Packet Transformation

**Python → Codec → Server:**

```
Python sends:
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}

Codec returns:
{
  type: "alert",
  nodeID: 2,
  risk_type: "chainsaw",
  risk_level: 1,
  confidence: 87.3
}

Server processes:
- Checks for ongoing incident
- Creates new incident if needed (is_incident_start=1)
- Stores in Risks: (nodeID=2, risk_type='chainsaw', fire_risklvl=1, confidence=87.3)
- Resets cooldown_counter to 0
- Broadcasts via WebSocket
```

## Incident Management

### Incident Lifecycle

1. **Alert Arrives** → New incident created (`is_incident_start=1`)
2. **More Alerts** → Added to same incident (share same timestamp)
3. **Reading Arrives** → Cooldown counter increments (1/5, 2/5, ...)
4. **5 Clean Readings** → Incident resolved (`resolved_at` set)

### Example Timeline

```
T=0s:  Alert (chainsaw) → Incident created, counter=0
T=10s: Reading (normal) → Counter=1/5
T=20s: Reading (normal) → Counter=2/5
T=30s: Alert (chainsaw) → Counter reset to 0
T=40s: Reading (normal) → Counter=1/5
T=50s: Reading (normal) → Counter=2/5
T=60s: Reading (normal) → Counter=3/5
T=70s: Reading (normal) → Counter=4/5
T=80s: Reading (normal) → Counter=5/5 → INCIDENT RESOLVED
```

## WebSocket Events

### Events Sent to Dashboard

**new_reading:**
```json
{
  "event": "new_reading",
  "timestamp": "2025-12-14T15:30:00Z",
  "data": {
    "readingID": 123,
    "nodeID": 2,
    "temperature": 25.5,
    "humidity": 60.2,
    "co_level": 5.1,
    "location": { "latitude": 14.5995, "longitude": 120.9842, ... },
    "rssi": -85,
    "snr": 8.5
  }
}
```

**risk_detected:**
```json
{
  "event": "risk_detected",
  "timestamp": "2025-12-14T15:31:00Z",
  "data": {
    "nodeID": 2,
    "risks": [{
      "riskID": 45,
      "risk_type": "chainsaw",
      "risk_level": 1,
      "confidence": 87.3,
      "isNewIncident": true
    }]
  }
}
```

**[risk_type]_resolved:**
```json
{
  "event": "chainsaw_resolved",
  "timestamp": "2025-12-14T15:35:00Z",
  "data": {
    "nodeID": 2,
    "risk_type": "chainsaw",
    "incidentTimestamp": "2025-12-14T15:31:00Z",
    "alertsResolved": 3
  }
}
```

**[risk_type]_cooldown_update:**
```json
{
  "event": "chainsaw_cooldown_update",
  "timestamp": "2025-12-14T15:32:00Z",
  "data": {
    "nodeID": 2,
    "risk_type": "chainsaw",
    "cooldown_counter": 2,
    "incidentTimestamp": "2025-12-14T15:31:00Z"
  }
}
```

## Troubleshooting

### Problem: No data appearing in dashboard

**Check:**
1. Is ChirpStack configured with HTTP integration pointing to your server?
2. Is the corrected codec deployed in ChirpStack?
3. Is the server running on the correct port?
4. Check server logs for errors

**Verify:**
```bash
# Check if server is receiving requests
tail -f server/logs/access.log

# Check for errors
tail -f server/logs/error.log

# Test directly
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

### Problem: Alerts not working but readings work

**Check:**
1. Python script audio detection is running
2. Audio persistence threshold is being met (30% over 10 seconds)
3. Fire sensor thresholds are configured correctly

**Verify:**
```sql
-- Check if alerts are being stored
SELECT * FROM Risks ORDER BY timestamp DESC LIMIT 10;

-- Check risk types
SELECT risk_type, COUNT(*) FROM Risks GROUP BY risk_type;
```

### Problem: GPS data not showing

**Check:**
1. GPS module has fix (`gps_fix: true` in Python payload)
2. GPS coordinates are not null
3. Database stores GPS data correctly

**Verify:**
```sql
-- Check GPS data
SELECT g.*, r.timestamp 
FROM GPSData g 
LEFT JOIN Readings r ON g.readingID = r.readingID 
ORDER BY g.gpsID DESC LIMIT 10;
```

### Problem: Cooldown not working

**Check:**
1. Python script sends readings every 10 seconds consistently
2. Readings have correct `type: "reading"` field
3. Server logic for cooldown counter is working

**Verify:**
```sql
-- Check cooldown progress
SELECT riskID, risk_type, cooldown_counter, resolved_at 
FROM Risks 
WHERE resolved_at IS NULL
ORDER BY updated_at DESC;
```

## Performance Considerations

### Database
- SQLite is sufficient for single-node deployments
- For multi-node, consider PostgreSQL
- Add indexes on frequently queried columns:
  ```sql
  CREATE INDEX idx_readings_nodeid ON Readings(nodeID);
  CREATE INDEX idx_risks_nodeid_type ON Risks(nodeID, risk_type);
  ```

### WebSocket
- Current implementation supports multiple clients
- Each client receives all events
- Consider implementing rooms for scaling

### LoRaWAN
- Maximum payload size: ~200 bytes (depends on data rate)
- Current JSON payloads are within limits
- Consider binary encoding for larger deployments

## Security Considerations

### Current Implementation
- ✅ CORS enabled for API access
- ✅ WebSocket authentication via connection token
- ⚠️ No authentication on /api/lora endpoint

### Recommendations
1. Add API key authentication for LoRa endpoint
2. Use HTTPS in production
3. Validate payload size limits
4. Rate limit API endpoints
5. Sanitize database inputs (currently using parameterized queries ✅)

## Next Steps

1. **Deploy Corrected Codec** to ChirpStack
2. **Test Integration** with real sensor node
3. **Monitor Logs** for any issues
4. **Verify Data Flow** end-to-end
5. **Document** any production-specific configuration

## Support

For issues or questions:
- Check `CODEC_VERIFICATION.md` for detailed analysis
- Review `TEST_PAYLOADS.md` for testing examples
- See `PYTHON_SCRIPT_FIX.md` for Python script details
- Server logs: Check console output
- Database: SQLite at `server/db/eco.db`

## Files in This Repository

- `CHIRPSTACK_CODEC_CORRECTED.js` - Fixed decoder for ChirpStack
- `CODEC_VERIFICATION.md` - Detailed compatibility analysis
- `TEST_PAYLOADS.md` - Test cases and examples
- `PYTHON_SCRIPT_FIX.md` - Python script analysis
- `INTEGRATION_SUMMARY.md` - This file
- `server/routes/lora.js` - Server-side handling
- `server/db/db.js` - Database schema
