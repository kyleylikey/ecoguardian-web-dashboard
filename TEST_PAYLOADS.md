# Test Payloads for ChirpStack Integration

This document provides test payloads to verify the complete data pipeline from ChirpStack to the dashboard.

## How to Test

You can send these payloads directly to your server endpoint to test without a real sensor node:

```bash
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d @test_payload.json
```

## Test Payload 1: Normal Reading

**What Python sends (as JSON bytes):**
```json
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

**After ChirpStack decoding (using corrected codec), server receives:**
```json
{
  "deviceInfo": {
    "tenantId": "...",
    "deviceName": "sensor-node-2"
  },
  "devEui": "0000000000000002",
  "received_at": "2025-12-14T15:30:00Z",
  "object": {
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": {
        "temperature": 25.5,
        "humidity": 60.2
      },
      "gas": {
        "co_ppm": 5.1
      },
      "gps": {
        "latitude": 14.5995,
        "longitude": 120.9842,
        "altitude": 50.5,
        "fix": true
      }
    }
  }
}
```

**Database inserts:**
- Readings: `temperature=25.5, humidity=60.2, co_level=5.1`
- GPSData: `latitude=14.5995, longitude=120.9842, altitude=50.5, fix=1`

**Expected result:** ✅ Reading appears in dashboard, sensor data visible

---

## Test Payload 2: Chainsaw Alert (from audio detection)

**What Python sends (as JSON bytes):**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}
```

**After ChirpStack decoding (using corrected codec), server receives:**
```json
{
  "deviceInfo": {
    "tenantId": "...",
    "deviceName": "sensor-node-2"
  },
  "devEui": "0000000000000002",
  "received_at": "2025-12-14T15:31:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 87.3
  }
}
```

**Database inserts:**
- Risks: `risk_type='chainsaw', fire_risklvl=1, confidence=87.3, is_incident_start=1`

**Expected result:** ✅ Chainsaw alert appears in dashboard, incident created

---

## Test Payload 3: Gunshot Alert (from audio detection)

**What Python sends (as JSON bytes):**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "gunshots",
  "risk_level": 2,
  "confidence": 91.8
}
```

**After ChirpStack decoding (using corrected codec), server receives:**
```json
{
  "deviceInfo": {
    "tenantId": "...",
    "deviceName": "sensor-node-2"
  },
  "devEui": "0000000000000002",
  "received_at": "2025-12-14T15:32:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "gunshots",
    "risk_level": 2,
    "confidence": 91.8
  }
}
```

**Database inserts:**
- Risks: `risk_type='gunshots', fire_risklvl=2, confidence=91.8, is_incident_start=1`

**Expected result:** ✅ Gunshot alert appears in dashboard, incident created

---

## Test Payload 4: Fire Alert (from sensor thresholds)

**What Python sends (as JSON bytes):**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "fire",
  "risk_level": 3,
  "confidence": null
}
```

**After ChirpStack decoding (using corrected codec), server receives:**
```json
{
  "deviceInfo": {
    "tenantId": "...",
    "deviceName": "sensor-node-2"
  },
  "devEui": "0000000000000002",
  "received_at": "2025-12-14T15:33:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "fire",
    "risk_level": 3,
    "confidence": null
  }
}
```

**Database inserts:**
- Risks: `risk_type='fire', fire_risklvl=3, confidence=NULL, is_incident_start=1`

**Expected result:** ✅ Fire alert appears in dashboard, incident created

---

## Test Payload 5: Reading with High Values (should NOT trigger alert)

**What Python sends (as JSON bytes):**
```json
{
  "type": "reading",
  "nodeID": 2,
  "temp": 35.0,
  "humidity": 45.0,
  "co_ppm": 8.5,
  "latitude": 14.5995,
  "longitude": 120.9842,
  "altitude": 50.5,
  "gps_fix": true
}
```

**Note:** Even though temp=35°C and co_ppm=8.5 are high, the Python script only sends a fire alert when ALL conditions are met:
- temp > 30°C (Celsius) AND humidity < 60% AND co_ppm > 10 ppm

So this should be processed as a regular reading, not an alert.

**Expected result:** ✅ Reading stored, no alert triggered, cooldown counter increments for any active incidents

---

## Test Payload 6: Alert with Sensor Data (combined)

The Python script can send alerts with additional sensor data when available:

**What Python sends (as JSON bytes):**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 89.2,
  "temp": 26.5,
  "humidity": 58.0,
  "co_ppm": 6.2,
  "latitude": 14.5996,
  "longitude": 120.9843,
  "altitude": 51.0,
  "gps_fix": true
}
```

**After ChirpStack decoding, server receives:**
```json
{
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 89.2
  }
}
```

**Note:** The corrected codec only passes through alert-specific fields. Temperature, humidity, etc. are ignored in alerts. This matches the Python script behavior where alerts are sent separately from readings.

---

## Test Payload 7: Invalid Risk Type (should be rejected)

**What gets sent:**
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "earthquake",
  "risk_level": 1,
  "confidence": 95.0
}
```

**Expected result:** ❌ Database constraint violation, error logged
- Database CHECK constraint: `risk_type IN ('fire','chainsaw','gunshots')`
- Server should handle error gracefully

---

## Test Payload 8: Missing GPS Fix

**What Python sends:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "temp": 24.0,
  "humidity": 62.0,
  "co_ppm": 4.5,
  "latitude": null,
  "longitude": null,
  "altitude": null,
  "gps_fix": false
}
```

**After decoding:**
```json
{
  "object": {
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": {
        "temperature": 24.0,
        "humidity": 62.0
      },
      "gas": {
        "co_ppm": 4.5
      },
      "gps": {
        "latitude": null,
        "longitude": null,
        "altitude": null,
        "fix": false
      }
    }
  }
}
```

**Expected result:** ✅ Reading stored, GPS data stored with nulls and fix=0

---

## Automated Test Script

Save this as `test_integration.sh`:

```bash
#!/bin/bash

# Test script for ChirpStack integration
API_URL="http://localhost:3000/api/lora"

echo "Testing ChirpStack Integration..."
echo "=================================="

# Test 1: Normal Reading
echo -e "\n[Test 1] Sending normal reading..."
curl -X POST "$API_URL" \
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

sleep 2

# Test 2: Chainsaw Alert
echo -e "\n\n[Test 2] Sending chainsaw alert..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "received_at": "2025-12-14T15:31:00Z",
    "object": {
      "type": "alert",
      "nodeID": 2,
      "risk_type": "chainsaw",
      "risk_level": 1,
      "confidence": 87.3
    }
  }'

sleep 2

# Test 3: Gunshot Alert
echo -e "\n\n[Test 3] Sending gunshot alert..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "received_at": "2025-12-14T15:32:00Z",
    "object": {
      "type": "alert",
      "nodeID": 2,
      "risk_type": "gunshots",
      "risk_level": 2,
      "confidence": 91.8
    }
  }'

sleep 2

# Test 4: Fire Alert
echo -e "\n\n[Test 4] Sending fire alert..."
curl -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "received_at": "2025-12-14T15:33:00Z",
    "object": {
      "type": "alert",
      "nodeID": 2,
      "risk_type": "fire",
      "risk_level": 3,
      "confidence": null
    }
  }'

echo -e "\n\n=================================="
echo "Testing complete!"
echo "Check the dashboard and database to verify data was stored correctly."
```

Make it executable:
```bash
chmod +x test_integration.sh
```

Run it:
```bash
./test_integration.sh
```

---

## Verification Checklist

After running tests, verify:

### In Dashboard
- [ ] Reading appears in "Latest Readings" section
- [ ] Temperature, humidity, CO level displayed correctly
- [ ] GPS location shown on map
- [ ] Chainsaw alert appears in alerts panel
- [ ] Gunshot alert appears in alerts panel
- [ ] Fire alert appears in alerts panel
- [ ] Alert badges show correct counts

### In Database
```sql
-- Check readings
SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 5;

-- Check risks
SELECT * FROM Risks ORDER BY timestamp DESC LIMIT 5;

-- Check GPS data
SELECT * FROM GPSData ORDER BY gpsID DESC LIMIT 5;

-- Check sensor nodes status
SELECT * FROM SensorNodes;
```

### Expected Database Values
- Readings table should have temp, humidity, co_level
- Risks table should have correct risk_type ('fire', 'chainsaw', or 'gunshots')
- fire_risklvl should store the risk_level value (can be TEXT or INTEGER)
- confidence should be stored as REAL for audio alerts, NULL for fire
- GPSData should have latitude, longitude, altitude, and fix boolean

---

## Common Issues

### Issue 1: "Missing object payload"
**Cause:** Request doesn't have `req.body.object`
**Solution:** Ensure payload structure matches ChirpStack HTTP integration format

### Issue 2: "No risks provided in alert"
**Cause:** Alert type but missing risk_type field
**Solution:** Ensure codec returns risk_type for alert packets

### Issue 3: Database constraint violation on risk_type
**Cause:** risk_type not in ('fire', 'chainsaw', 'gunshots')
**Solution:** Verify Python script sends correct values

### Issue 4: GPS data not appearing
**Cause:** GPS fix=false or null values
**Solution:** Check GPS hardware and wait for fix before sending data

### Issue 5: Cooldown not working
**Cause:** Not sending regular readings after alerts
**Solution:** Ensure Python script sends reading packets every 10 seconds even during incidents
