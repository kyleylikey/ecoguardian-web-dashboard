# ⚡ Quick Fix: type and nodeID are undefined

## Problem
```
📥 Received LoRa payload: { type: undefined, nodeID: undefined, ... }
```

## Cause
❌ The corrected codec has **NOT** been deployed to ChirpStack yet.

## Solution (5 Minutes)

### Step 1: Open ChirpStack
1. Log into ChirpStack console
2. Go to: **Applications → EcoGuardian Network → Device Profile → Codec** OR **Applications → EcoGuardian Network → Codec**

### Step 2: Deploy Corrected Codec
1. Open `CHIRPSTACK_CODEC_CORRECTED.js` from this repository
2. **Select ALL** (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. In ChirpStack codec editor: **Select ALL existing code**
5. **Paste** (Ctrl+V / Cmd+V) to replace everything
6. Click **Save** or **Update**

### Step 3: Test Immediately
In ChirpStack, use the test function with this base64 data:
```
eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6MiwidGVtcCI6MjUuNiwiaHVtaWRpdHkiOjY3LjMsImNvX3BwbSI6My40LCJsYXRpdHVkZSI6bnVsbCwibG9uZ2l0dWRlIjpudWxsLCJhbHRpdHVkZSI6bnVsbCwiZ3BzX2ZpeCI6ZmFsc2V9
```

**Expected result:**
```json
{
  "type": "reading",     ← MUST be present!
  "nodeID": 2,           ← MUST be present!
  "data": {
    "temp_humid": {...},
    "gas": {...},
    "gps": {...}
  }
}
```

**If you don't see `type` and `nodeID`, the codec is still wrong!**

### Step 4: Wait for Next Packet
Your sensor sends every 10 seconds. Within 10 seconds you should see:
```
📥 Received LoRa payload: { type: 'reading', nodeID: 2, rssi: -84, snr: 12.2 }
✅ Reading saved - readingID: 123
```

## What Your ChirpStack Shows Now

Your current `object` field:
```json
{
  "gas": {...},
  "temp_humid": {...},
  "gps": {...}
}
```

Missing: `type`, `nodeID`, and wrapping `data` property!

## What It Should Show

After deploying corrected codec:
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "gas": {...},
    "temp_humid": {...},
    "gps": {...}
  }
}
```

## Verification Checklist

- [ ] Deployed complete codec from `CHIRPSTACK_CODEC_CORRECTED.js`
- [ ] Tested in ChirpStack (shows `type` and `nodeID`)
- [ ] Waited 10 seconds for new packet
- [ ] Server logs show `type: 'reading'` (not undefined)
- [ ] Dashboard shows new readings
- [ ] Database has new entries

## Still Not Working?

1. **Check which codec tab**: Make sure you're editing the **Decoder/Uplink**, not Encoder
2. **Copy complete file**: Make sure you copied ALL 115 lines from `CHIRPSTACK_CODEC_CORRECTED.js`
3. **Save and refresh**: After saving, refresh the ChirpStack page and verify code is still there
4. **Restart ChirpStack**: If cached, restart the ChirpStack application

## Need Help?

Share:
1. Screenshot of ChirpStack Codec page (the decoder function)
2. Screenshot of ChirpStack Test Decoder result
3. Server logs after deploying

---

**TL;DR**: Copy ALL of `CHIRPSTACK_CODEC_CORRECTED.js` into ChirpStack codec editor and save. Test. Wait 10 seconds. Check logs.
