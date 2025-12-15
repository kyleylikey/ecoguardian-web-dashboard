# ChirpStack Codec Deployment Checklist

## Pre-Deployment Verification

### ✅ System Status Check

- [ ] Dashboard server is running and accessible
- [ ] Database (eco.db) is accessible and has sensor nodes
- [ ] WebSocket server is operational
- [ ] ChirpStack network server is running
- [ ] LoRa gateway is connected
- [ ] Python sensor script is ready

### ✅ Documentation Review

- [ ] Read `CHIRPSTACK_INTEGRATION_README.md` (Quick Start)
- [ ] Review `CODEC_COMPARISON.md` (Understand the issue)
- [ ] Check `INTEGRATION_SUMMARY.md` (System architecture)

## Deployment Steps

### Step 1: Backup Current Configuration ⚠️

Before making changes, save your current ChirpStack codec:

- [ ] Log into ChirpStack console
- [ ] Navigate to: Applications → [Your App] → Codec
- [ ] Copy current decoder function to a backup file
- [ ] Save as `backup_decoder_YYYYMMDD.js`

### Step 2: Deploy Corrected Codec

- [ ] Open `CHIRPSTACK_CODEC_CORRECTED.js` in this repository
- [ ] Copy the entire decoder function
- [ ] In ChirpStack: Applications → [Your App] → Codec
- [ ] Paste the corrected decoder function
- [ ] Click "Save" or "Update"

### Step 3: Test Codec in ChirpStack

ChirpStack has a built-in test feature:

**Test Case 1: Reading**
- [ ] Click "Test decoder" in ChirpStack
- [ ] Enter test bytes (or use built-in encoder if available)
- [ ] Verify output structure matches:
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": { ... }
}
```
- [ ] ⚠️ If you see `{ "data": { "type": ... } }`, codec is still wrong!

**Test Case 2: Alert**
- [ ] Test with alert payload
- [ ] Verify output structure matches:
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}
```

### Step 4: Integration Testing

**Option A: Automated Tests**
```bash
# From repository root
./test_integration.sh
```

- [ ] Run automated test script
- [ ] Verify all tests pass (green checkmarks)
- [ ] Check server logs for successful processing

**Option B: Manual Tests**
```bash
# Test reading packet
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d @test_reading.json
```

- [ ] Send test reading packet
- [ ] Check response is 200 OK
- [ ] Verify data appears in database
- [ ] Confirm WebSocket broadcast sent

### Step 5: Database Verification

```bash
cd server
sqlite3 db/eco.db
```

**Check Readings:**
```sql
SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 5;
```
- [ ] Verify temperature, humidity, co_level are populated
- [ ] Check timestamps are recent
- [ ] Confirm nodeID is correct

**Check GPS Data:**
```sql
SELECT * FROM GPSData ORDER BY gpsID DESC LIMIT 5;
```
- [ ] Verify latitude, longitude, altitude are populated
- [ ] Check fix status is boolean (0 or 1)

**Check Risks (if alerts sent):**
```sql
SELECT * FROM Risks ORDER BY timestamp DESC LIMIT 5;
```
- [ ] Verify risk_type is one of: 'fire', 'chainsaw', 'gunshots'
- [ ] Check confidence values for audio alerts
- [ ] Confirm cooldown_counter is updating

**Check Sensor Nodes:**
```sql
SELECT nodeID, name, status, last_seen FROM SensorNodes;
```
- [ ] Verify last_seen is updating
- [ ] Check status changes to 'active'

### Step 6: Dashboard Verification

Open dashboard in browser: `http://localhost:5173`

**Latest Readings Section:**
- [ ] New readings appear automatically
- [ ] Temperature displays correctly
- [ ] Humidity displays correctly
- [ ] CO level displays correctly
- [ ] Timestamp is accurate

**Map Section:**
- [ ] GPS markers appear
- [ ] Location is accurate
- [ ] Marker shows correct node information

**Alerts Section:**
- [ ] New alerts appear in real-time
- [ ] Alert type is correct (fire/chainsaw/gunshots)
- [ ] Confidence percentage shown for audio alerts
- [ ] Alert badges update

**WebSocket Console (Browser DevTools):**
```javascript
// Open browser console and check for WebSocket messages
// Should see events like:
// { event: "new_reading", data: { ... } }
// { event: "risk_detected", data: { ... } }
```
- [ ] WebSocket connection established
- [ ] Real-time messages received
- [ ] Message structure is correct

### Step 7: Live Sensor Testing

**With Python Script:**
- [ ] Deploy corrected codec to ChirpStack
- [ ] Start Python sensor script
- [ ] Wait for regular readings (every 10 seconds)
- [ ] Trigger alert conditions (if possible)
- [ ] Monitor dashboard for updates

**Expected Behavior:**
- [ ] Readings appear every 10 seconds
- [ ] GPS location updates when fix available
- [ ] Sensor values display correctly
- [ ] Alerts trigger when thresholds met
- [ ] Incidents group correctly
- [ ] Cooldown mechanism works (5 readings to resolve)

### Step 8: End-to-End Validation

**Simulate Complete Incident Lifecycle:**

1. **Initial State:**
   - [ ] Dashboard shows normal readings
   - [ ] No active alerts

2. **Alert Triggered:**
   - [ ] Send alert packet (chainsaw/gunshots/fire)
   - [ ] Alert appears in dashboard immediately
   - [ ] Database shows new Risk record with is_incident_start=1
   - [ ] Cooldown counter is 0

3. **Cooldown Phase:**
   - [ ] Send 1st reading → Counter = 1/5
   - [ ] Send 2nd reading → Counter = 2/5
   - [ ] Send 3rd reading → Counter = 3/5
   - [ ] Send 4th reading → Counter = 4/5
   - [ ] Verify dashboard shows cooldown progress

4. **Resolution:**
   - [ ] Send 5th reading → Counter = 5/5
   - [ ] Alert auto-resolves
   - [ ] Dashboard updates to show resolved status
   - [ ] Database shows resolved_at timestamp

5. **Multiple Incidents:**
   - [ ] Send chainsaw alert → New incident created
   - [ ] Send fire alert → Separate incident created
   - [ ] Both show as active simultaneously
   - [ ] Each has independent cooldown counter
   - [ ] Readings increment both counters
   - [ ] Each resolves independently

## Post-Deployment Monitoring

### First Hour
- [ ] Monitor server logs for errors
- [ ] Check database growth (size, record count)
- [ ] Verify WebSocket connections stable
- [ ] Confirm no memory leaks

### First Day
- [ ] Review all alert types were received correctly
- [ ] Check GPS data accuracy
- [ ] Verify incident grouping works across hours
- [ ] Monitor cooldown mechanism reliability

### First Week
- [ ] Analyze data quality and completeness
- [ ] Check for any missed packets
- [ ] Verify database performance
- [ ] Review dashboard responsiveness

## Rollback Plan

If issues occur after deployment:

### Step 1: Restore Previous Codec
- [ ] Log into ChirpStack console
- [ ] Navigate to: Applications → [Your App] → Codec
- [ ] Paste backup decoder function
- [ ] Click "Save"

### Step 2: Verify Rollback
- [ ] Test with sensor node
- [ ] Check if system returns to previous behavior
- [ ] Review logs for new errors

### Step 3: Document Issues
- [ ] Record error messages
- [ ] Note when issues occurred
- [ ] Capture example payloads
- [ ] Check database state

### Step 4: Investigate
- [ ] Review server logs
- [ ] Check ChirpStack logs
- [ ] Examine database integrity
- [ ] Test with curl manually

## Troubleshooting Guide

### Issue: No Data After Deployment

**Check:**
1. ChirpStack codec saved correctly?
2. HTTP integration endpoint correct?
3. Server receiving requests? (check logs)
4. Database writable?

**Test:**
```bash
# Test server directly with a reading packet
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "received_at": "2025-12-14T15:30:00Z",
  "object": {
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": {"temperature": 25.5, "humidity": 60},
      "gas": {"co_ppm": 5},
      "gps": {"latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true}
    }
  }
}
EOF
```

### Issue: Partial Data Only

**Check:**
1. Are all sensor values being sent by Python script?
2. GPS fix status? (fix=false means no location)
3. Database constraints? (check for NULLs)

**Test:**
```sql
-- Check for NULL values
SELECT COUNT(*) as null_temps FROM Readings WHERE temperature IS NULL;
SELECT COUNT(*) as null_humid FROM Readings WHERE humidity IS NULL;
SELECT COUNT(*) as null_co FROM Readings WHERE co_level IS NULL;
```

### Issue: Alerts Not Working

**Check:**
1. Alert payload structure correct?
2. risk_type valid? (must be 'fire', 'chainsaw', 'gunshots')
3. Server alert handling code working?

**Test:**
```bash
# Send test chainsaw alert
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "received_at": "2025-12-14T15:30:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 87.3
  }
}
EOF
```

### Issue: WebSocket Not Updating

**Check:**
1. WebSocket server running?
2. Client connected? (check browser console)
3. Firewall blocking WebSocket port?

**Test:**
```javascript
// In browser console
const ws = new WebSocket('ws://localhost:3000');
ws.onopen = () => console.log('Connected');
ws.onmessage = (msg) => console.log('Received:', msg.data);
```

### Issue: Cooldown Not Working

**Check:**
1. Are readings being sent consistently?
2. Is type="reading" in packet?
3. Database updating cooldown_counter?

**Test:**
```sql
-- Check cooldown progress
SELECT riskID, risk_type, cooldown_counter, resolved_at, updated_at 
FROM Risks 
WHERE resolved_at IS NULL 
ORDER BY updated_at DESC;
```

## Success Criteria

Your deployment is successful when:

- ✅ Readings arrive every 10 seconds
- ✅ All sensor values (temp, humidity, CO) are displayed
- ✅ GPS location appears on map when fix available
- ✅ Chainsaw alerts trigger and display correctly
- ✅ Gunshot alerts trigger and display correctly
- ✅ Fire alerts trigger and display correctly
- ✅ Incidents auto-resolve after 5 clean readings
- ✅ WebSocket updates in real-time (< 1 second delay)
- ✅ Database stores all data correctly
- ✅ No errors in server logs
- ✅ Dashboard responsive and stable

## Performance Benchmarks

Expected performance after deployment:

| Metric | Target | Acceptable | Action Required |
|--------|--------|------------|-----------------|
| Packet Loss | 0% | < 5% | > 5% investigate |
| Database Insert Time | < 10ms | < 50ms | > 100ms optimize |
| WebSocket Latency | < 100ms | < 500ms | > 1s troubleshoot |
| Dashboard Load Time | < 2s | < 5s | > 10s investigate |
| Memory Usage (Server) | < 100MB | < 250MB | > 500MB investigate |

## Documentation

After successful deployment, document:

- [ ] Date and time of deployment
- [ ] Version of codec deployed
- [ ] Any configuration changes made
- [ ] Test results and validation steps
- [ ] Any issues encountered and resolutions
- [ ] Performance baseline metrics

## Next Steps

After successful deployment:

1. **Monitor** - Watch for 24 hours continuously
2. **Optimize** - Identify any bottlenecks
3. **Scale** - Add more sensor nodes if needed
4. **Backup** - Regular database backups
5. **Maintain** - Keep documentation updated

## Support Contacts

For issues or questions:
- Check documentation files in repository
- Review server logs: `tail -f server/logs/*.log`
- Test with provided test suite: `./test_integration.sh`
- Inspect database: `sqlite3 server/db/eco.db`

## Appendix: Quick Reference

### File Locations
- Codec: `CHIRPSTACK_CODEC_CORRECTED.js`
- Server: `server/server.js`
- Routes: `server/routes/lora.js`
- Database: `server/db/eco.db`
- Schema: `server/db/db.js`

### Important Commands
```bash
# Start server
cd server && npm start

# Run tests
./test_integration.sh

# Check database
sqlite3 server/db/eco.db "SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 5;"

# Test endpoint
curl -X POST http://localhost:3000/api/lora -H "Content-Type: application/json" -d @test.json

# Monitor logs
tail -f server/*.log
```

### Database Queries
```sql
-- Latest readings
SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 10;

-- Active incidents
SELECT * FROM Risks WHERE resolved_at IS NULL ORDER BY timestamp DESC;

-- Sensor status
SELECT nodeID, name, status, last_seen FROM SensorNodes;

-- GPS data
SELECT * FROM GPSData ORDER BY gpsID DESC LIMIT 10;
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-12-14  
**Deployment Checklist Completed By**: _________________  
**Date**: _________________
