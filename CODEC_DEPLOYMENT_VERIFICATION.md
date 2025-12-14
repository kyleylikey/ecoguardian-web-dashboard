# Codec Deployment Verification Guide

## How to Know If Correct Codec Is Deployed

### ❌ WRONG CODEC (What You Have Now)

**ChirpStack Events → `object` field:**
```json
{
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

**Server Logs:**
```
📥 Received LoRa payload: { type: undefined, nodeID: undefined, rssi: -84, snr: 12.2 }
```

**Problem:** Missing `type`, `nodeID`, and `data` wrapper!

---

### ✅ CORRECT CODEC (What You Need)

**ChirpStack Events → `object` field:**
```json
{
  "type": "reading",           ← ✅ Present
  "nodeID": 2,                 ← ✅ Present
  "data": {                    ← ✅ Wrapper present
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

**Server Logs:**
```
📥 Received LoRa payload: { type: 'reading', nodeID: 2, rssi: -84, snr: 12.2 }
✅ Reading saved - readingID: 123
```

**Success Indicators:**
- ✅ `type` field exists and shows `"reading"`
- ✅ `nodeID` field exists and shows `2`
- ✅ Sensor data wrapped in `data` property
- ✅ Server logs show actual values, not `undefined`
- ✅ Database receives and stores readings

---

## Visual Comparison

### Your Current ChirpStack JSON Structure

```
{
  "deduplicationId": "...",
  "time": "...",
  "deviceInfo": {...},
  "devAddr": "01122765",
  "fPort": 1,
  "data": "eyJ0eXBlIjoi...",  ← Raw base64 payload
  "object": {                 ← Decoded by your codec
    "gas": {...},             ← ❌ Wrong structure
    "temp_humid": {...},      ← ❌ Missing type
    "gps": {...}              ← ❌ Missing nodeID
  },
  "rxInfo": [...]
}
```

### What It Should Look Like

```
{
  "deduplicationId": "...",
  "time": "...",
  "deviceInfo": {...},
  "devAddr": "01122765",
  "fPort": 1,
  "data": "eyJ0eXBlIjoi...",  ← Raw base64 payload
  "object": {                 ← Decoded by corrected codec
    "type": "reading",        ← ✅ Correct
    "nodeID": 2,              ← ✅ Correct
    "data": {                 ← ✅ Correct wrapper
      "temp_humid": {...},
      "gas": {...},
      "gps": {...}
    }
  },
  "rxInfo": [...]
}
```

---

## ChirpStack Test Function

### How to Test Before Waiting for Real Sensor

1. In ChirpStack, go to **Applications → EcoGuardian Network → Codec**
2. Look for **"Test decoder"** or **"Test"** button
3. You'll see two input fields:
   - **Bytes (hex)**: Leave empty or use the base64 below
   - **FPort**: Enter `1`

4. Use this test input (base64 of your actual JSON):
```
eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6MiwidGVtcCI6MjUuNiwiaHVtaWRpdHkiOjY3LjMsImNvX3BwbSI6My40LCJsYXRpdHVkZSI6bnVsbCwibG9uZ2l0dWRlIjpudWxsLCJhbHRpdHVkZSI6bnVsbCwiZ3BzX2ZpeCI6ZmFsc2V9
```

This decodes to:
```json
{"type":"reading","nodeID":2,"temp":25.6,"humidity":67.3,"co_ppm":3.4,"latitude":null,"longitude":null,"altitude":null,"gps_fix":false}
```

### Expected Test Result

**With WRONG codec:**
```json
{
  "gas": {"co_ppm": 3.4},
  "temp_humid": {"humidity": 67.3, "temperature": 25.6},
  "gps": {"fix": false, "altitude": null, "longitude": null, "latitude": null}
}
```
❌ Missing `type` and `nodeID`!

**With CORRECT codec:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "temp_humid": {"temperature": 25.6, "humidity": 67.3},
    "gas": {"co_ppm": 3.4},
    "gps": {"latitude": null, "longitude": null, "altitude": null, "fix": false}
  }
}
```
✅ Has `type`, `nodeID`, and `data` wrapper!

---

## Step-by-Step Verification

### Before Deploying Codec

1. **Check Current Behavior**
   - Look at ChirpStack Events
   - Look at server logs
   - Note: `type: undefined, nodeID: undefined`

### During Deployment

1. **Open Codec Editor in ChirpStack**
   - Screenshot the current codec (for backup)
   
2. **Replace with Corrected Codec**
   - Open `CHIRPSTACK_CODEC_CORRECTED.js`
   - Select ALL (Ctrl+A)
   - Copy (Ctrl+C)
   - In ChirpStack: Select ALL in editor
   - Paste (Ctrl+V)
   - **Verify all ~115 lines are there**

3. **Save**
   - Click Save/Update button
   - Wait for confirmation message

### After Deploying Codec

1. **Test Immediately**
   - Use ChirpStack's test function
   - Paste test base64 payload
   - Check output has `type` and `nodeID`
   - **If not, codec didn't save correctly!**

2. **Wait for Real Sensor Packet**
   - Your sensor sends every 10 seconds
   - Within 10 seconds, check:

3. **Check ChirpStack Events**
   - Refresh the Events tab
   - Look at latest event
   - Check `object` field
   - Should now have `type`, `nodeID`, `data`

4. **Check Server Logs**
   - Should show: `type: 'reading', nodeID: 2`
   - Should NOT show: `type: undefined`

5. **Check Database**
   ```bash
   sqlite3 server/db/eco.db "SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 1;"
   ```
   - Should show new reading with actual values

6. **Check Dashboard**
   - Open http://localhost:5173
   - Should see new readings appear
   - Should see temperature, humidity, CO level

---

## Troubleshooting Test Results

### Test Shows Only Sensor Data (No type/nodeID)

**Problem:** Codec not deployed correctly or saved

**Solutions:**
1. Verify you copied the ENTIRE file (all 115 lines)
2. Check for JavaScript syntax errors in ChirpStack
3. Make sure you clicked Save
4. Refresh ChirpStack page and check if codec is still there
5. Try deploying again

### Test Shows Error Message

**Problem:** Syntax error in codec

**Solutions:**
1. Check ChirpStack error message
2. Look for missing commas, braces, or brackets
3. Re-copy from `CHIRPSTACK_CODEC_CORRECTED.js` (don't manually edit)
4. Make sure you're in the **Decoder** tab, not Encoder

### Test Works But Real Packets Don't

**Problem:** Cache or device-specific codec

**Solutions:**
1. Restart ChirpStack application server
2. Check if there's a device-specific codec overriding the application codec
3. Clear browser cache and reload ChirpStack
4. Wait 1-2 minutes for ChirpStack to reload configuration

### Test Shows "data" Wrapper Around Everything

**Problem:** You might have deployed the ORIGINAL (wrong) codec

**Solutions:**
1. Make sure you're using `CHIRPSTACK_CODEC_CORRECTED.js`
2. Look for this in the file:
   ```javascript
   return {
     type: jsonData.type,    // Should be at root level
     nodeID: jsonData.nodeID,
     data: {
   ```
3. NOT this:
   ```javascript
   return {
     data: {                 // This is wrong!
       type: jsonData.type,
   ```

---

## Success Checklist

After deploying the corrected codec, verify ALL of these:

- [ ] ChirpStack test function shows `type`, `nodeID`, and `data` at root
- [ ] ChirpStack Events tab shows `type` and `nodeID` in `object` field
- [ ] Server logs show `type: 'reading'` (not undefined)
- [ ] Server logs show `nodeID: 2` (not undefined)
- [ ] Database Readings table has new entries
- [ ] Database entries have actual temperature, humidity, co_level values (not NULL)
- [ ] Dashboard shows new readings in real-time
- [ ] No errors in server logs
- [ ] No "undefined" anywhere in logs

If ALL checkboxes are checked, deployment is successful! ✅

If ANY checkbox is unchecked, refer to troubleshooting sections above.

---

## Quick Reference

**File to deploy:** `CHIRPSTACK_CODEC_CORRECTED.js`

**Where to deploy:** ChirpStack → Applications → EcoGuardian Network → Codec

**Test payload:** 
```
eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6MiwidGVtcCI6MjUuNiwiaHVtaWRpdHkiOjY3LjMsImNvX3BwbSI6My40LCJsYXRpdHVkZSI6bnVsbCwibG9uZ2l0dWRlIjpudWxsLCJhbHRpdHVkZSI6bnVsbCwiZ3BzX2ZpeCI6ZmFsc2V9
```

**Expected test result:** Must include `type`, `nodeID`, and `data` wrapper

**Time to see results:** 10 seconds (next sensor packet)

**Verification:** Server logs should show `type: 'reading'` not `undefined`
