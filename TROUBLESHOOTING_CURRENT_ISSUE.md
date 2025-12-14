# 🚨 Current Issue: Codec Not Deployed

## What's Happening

Your server logs show:
```
📥 Received LoRa payload: { type: undefined, nodeID: undefined, rssi: -84, snr: 12.2 }
```

This confirms **the corrected codec has NOT been deployed to ChirpStack yet**.

## Evidence from ChirpStack JSON

Looking at your ChirpStack "received events" JSON, the `object` field contains:

```json
"object": {
    "gas": {
        "co_ppm": 3.4
    },
    "temp_humid": {
        "humidity": 67.3,
        "temperature": 25.6
    },
    "gps": {
        "fix": false,
        "altitude": null,
        "longitude": null,
        "latitude": null
    }
}
```

### What's Missing? 🔍

The `object` field should contain:
- ✅ `type` - **MISSING!**
- ✅ `nodeID` - **MISSING!**
- ✅ `data` - Present but at wrong level

### What Should Be There?

With the **corrected codec deployed**, it should look like:

```json
"object": {
    "type": "reading",           // ⬅️ MISSING in your output
    "nodeID": 2,                 // ⬅️ MISSING in your output
    "data": {                    // ⬅️ Should wrap the sensor data
        "temp_humid": {
            "humidity": 67.3,
            "temperature": 25.6
        },
        "gas": {
            "co_ppm": 3.4
        },
        "gps": {
            "fix": false,
            "altitude": null,
            "longitude": null,
            "latitude": null
        }
    }
}
```

## Root Cause Analysis

Looking at your ChirpStack output, it appears you may have deployed a **partially incorrect codec** that:
1. ✅ Correctly restructures the sensor data into `temp_humid`, `gas`, `gps`
2. ❌ Does NOT include `type` field
3. ❌ Does NOT include `nodeID` field
4. ❌ Does NOT wrap sensor data in a `data` property

This suggests you might be using a custom codec that only transforms the field names but doesn't include the required metadata fields.

## What Codec Is Currently Deployed?

Based on your output, your current codec appears to be doing something like:

```javascript
// CURRENT (INCOMPLETE) CODEC
function decodeUplink(input) {
  var jsonData = JSON.parse(jsonString);
  
  return {
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
  };
}
```

## The Fix: Deploy Complete Codec

You need to deploy the **complete codec** from `CHIRPSTACK_CODEC_CORRECTED.js`:

```javascript
// CORRECT (COMPLETE) CODEC
function decodeUplink(input) {
  var jsonString = String.fromCharCode.apply(null, input.bytes);
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData.type === "reading") {
    return {
      type: jsonData.type,        // ⬅️ Include type
      nodeID: jsonData.nodeID,    // ⬅️ Include nodeID
      data: {                     // ⬅️ Wrap in data property
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
  
  // ... (alert handling)
}
```

## Step-by-Step Fix

### 1. Verify Current Codec in ChirpStack

1. Log into ChirpStack console
2. Navigate to: **Applications → EcoGuardian Network → Codec**
3. Look at the decoder function
4. **Take a screenshot or copy it** to see what's actually deployed

### 2. Deploy Corrected Codec

1. Open `CHIRPSTACK_CODEC_CORRECTED.js` from this repository
2. **Copy the ENTIRE function** (all ~115 lines)
3. In ChirpStack: **Replace the entire decoder function**
4. Click **Save**

### 3. Test in ChirpStack Console

ChirpStack has a built-in test feature:

1. In the Codec page, look for a "Test" or "Test Decoder" button
2. Use this test payload (base64 decode of your actual data):
```
eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6MiwidGVtcCI6MjUuNiwiaHVtaWRpdHkiOjY3LjMsImNvX3BwbSI6My40LCJsYXRpdHVkZSI6bnVsbCwibG9uZ2l0dWRlIjpudWxsLCJhbHRpdHVkZSI6bnVsbCwiZ3BzX2ZpeCI6ZmFsc2V9
```

3. The decoded output should show:
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "temp_humid": { "temperature": 25.6, "humidity": 67.3 },
    "gas": { "co_ppm": 3.4 },
    "gps": { "latitude": null, "longitude": null, "altitude": null, "fix": false }
  }
}
```

4. **If you DON'T see `type` and `nodeID`**, the codec is still wrong!

### 4. Verify with Real Sensor

After deploying the corrected codec:

1. Send a test packet from your sensor node
2. Check ChirpStack "Events" tab
3. Look at the `object` field in the JSON
4. Verify it now includes `type`, `nodeID`, and `data`

### 5. Check Server Logs

After deploying corrected codec, you should see:

```
📥 Received LoRa payload: { type: 'reading', nodeID: 2, rssi: -84, snr: 12.2 }
✅ Reading saved - readingID: 123
```

NOT:

```
📥 Received LoRa payload: { type: undefined, nodeID: undefined, rssi: -84, snr: 12.2 }
```

## Quick Diagnostic Commands

### Check if Data is Being Stored

```bash
cd server
sqlite3 db/eco.db "SELECT COUNT(*) FROM Readings WHERE timestamp > datetime('now', '-1 hour');"
```

If this returns 0, no data is being stored (codec issue).

### Check Latest Database Entry

```bash
sqlite3 db/eco.db "SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 1;"
```

### Monitor Server in Real-Time

```bash
cd server
npm start
# Watch for the "Received LoRa payload" messages
```

## Common Mistakes

### Mistake 1: Copying Only Part of the Codec

Make sure you copy the **entire function** including:
- The opening `function decodeUplink(input) {`
- The try-catch wrapper
- ALL the if-else branches (reading, alert, unknown)
- The closing `}`

### Mistake 2: Syntax Errors

ChirpStack should show syntax errors when you save. If it does:
- Check for missing commas
- Check for unmatched braces
- Make sure you copied the complete function

### Mistake 3: Wrong Codec Tab

Make sure you're editing the **Decoder** (Uplink), not the Encoder (Downlink).

### Mistake 4: Not Saving

After pasting the codec:
- Click **Save** or **Update**
- Refresh the page to verify it's saved
- Test with the built-in test function

## Expected Timeline

1. **Deploy codec**: 2 minutes
2. **Test in ChirpStack**: 1 minute
3. **Wait for next sensor packet**: 10 seconds (your sensor sends every 10 seconds)
4. **Verify in server logs**: Immediate
5. **Check database**: Immediate
6. **See in dashboard**: Immediate (via WebSocket)

## Success Indicators

After deploying the corrected codec, you should see:

- ✅ Server logs show `type: 'reading'` and `nodeID: 2`
- ✅ ChirpStack Events show `type` and `nodeID` in `object` field
- ✅ Database Readings table has new entries
- ✅ Dashboard shows new readings
- ✅ No more "undefined" in server logs

## If Still Not Working

If you deploy the corrected codec and still see `type: undefined`:

1. **Clear ChirpStack cache**: Restart ChirpStack application server
2. **Check codec syntax**: Use ChirpStack's test function
3. **Verify deployment**: Look at the codec in ChirpStack UI
4. **Check for device-specific codec**: Make sure codec is at application level, not device level
5. **Review logs**: Check ChirpStack logs for decoder errors

## Next Steps

1. **Right now**: Deploy `CHIRPSTACK_CODEC_CORRECTED.js` to ChirpStack
2. **Wait 10 seconds**: Your sensor will send next packet
3. **Check server logs**: Should show `type: 'reading'` and `nodeID: 2`
4. **Verify dashboard**: Should show new readings
5. **Report back**: Let me know if you still see issues

## Screenshot Checklist

When troubleshooting, take screenshots of:

1. [ ] ChirpStack Codec page (showing the decoder function)
2. [ ] ChirpStack Test Decoder result
3. [ ] ChirpStack Events tab (showing the `object` field)
4. [ ] Server logs (showing the received payload)
5. [ ] Database query results
6. [ ] Dashboard view

This will help diagnose any remaining issues.

---

**Summary**: Your current codec is missing `type` and `nodeID` fields. Deploy the complete codec from `CHIRPSTACK_CODEC_CORRECTED.js` and verify using ChirpStack's test function before testing with real sensor data.
