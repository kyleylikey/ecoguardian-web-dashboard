# ChirpStack Codec Deployment Issues

## Issue

Python script sends correct JSON with `type` and `nodeID`:
```json
{"type":"reading","nodeID":2,"temp":26.0,"humidity":62.4,"co_ppm":2.9,"latitude":null,"longitude":null,"altitude":null,"gps_fix":false}
```

But ChirpStack Events still don't show `type` and `nodeID` in the decoded `object` field.

## Root Causes

This indicates the codec is **not being used** or **not properly deployed** in ChirpStack.

## Solution Steps

### Step 1: Verify Codec Location

ChirpStack has TWO places where codecs can be defined:

1. **Device Profile Level** (recommended)
2. **Application Level** (deprecated in v4)

**Check both locations:**

#### Option A: Device Profile Codec (Recommended)

1. Go to ChirpStack UI
2. Navigate: **Tenant → Device Profiles**
3. Find your profile: **"Sensor (ABP)"**
4. Click on it
5. Go to **"Codec"** tab
6. **Verify the decoder is there**

#### Option B: Application Codec (Legacy)

1. Go to ChirpStack UI
2. Navigate: **Applications → EcoGuardian Network**
3. Look for **"Codec"** tab
4. **If this exists, codec might be here instead**

**Important:** Device Profile codec takes precedence over Application codec!

### Step 2: Check if Codec is Actually Saved

1. Navigate to the correct codec location (Device Profile or Application)
2. Look at the decoder function
3. **Scroll to the bottom** - make sure ALL 120 lines are there
4. Check the last line should be `}` closing the `decodeUplink` function
5. If the function is incomplete, it won't work!

**Common mistake:** Copying only part of the codec file.

### Step 3: Restart ChirpStack Services

ChirpStack might cache the codec. Restart to clear the cache:

```bash
# For Docker deployment
docker-compose restart chirpstack

# For systemd deployment
sudo systemctl restart chirpstack

# For manual deployment
# Stop and start the ChirpStack process
```

### Step 4: Test the Codec in ChirpStack

ChirpStack has a built-in test function:

1. Go to the codec editor (Device Profile → Codec)
2. Look for **"Test decoder"** or **"Test"** button
3. Enter your test payload (hex or base64)

**Test with this exact payload that your sensor sends:**
```
Hex: 7b2274797065223a2272656164696e67222c226e6f6465494422...
```

Or use the base64 from ChirpStack Events `data` field.

**Expected output:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "temp_humid": {"temperature": 26.0, "humidity": 62.4},
    "gas": {"co_ppm": 2.9},
    "gps": {"latitude": null, "longitude": null, "altitude": null, "fix": false}
  }
}
```

**If test fails:**
- Check JavaScript syntax errors
- Look at error message
- Verify codec is complete

**If test works but real packets don't:**
- Codec is correct
- But ChirpStack isn't using it for your device
- Continue to Step 5

### Step 5: Check Device Configuration

Your device might be using a different codec or device profile:

1. Go to: **Applications → EcoGuardian Network → Devices**
2. Click on **"SensorNode02"** (your device with DevEUI: adfd340693b9b109)
3. Check the **"Device Profile"** field
4. It should show: **"Sensor (ABP)"**
5. Click on that profile name to verify it's the one with your codec

**If it's a different profile:**
- Either update that profile's codec
- Or change the device to use the correct profile

### Step 6: Verify Application Server Integration

ChirpStack needs to know where to send the decoded data:

1. Go to: **Applications → EcoGuardian Network → Integrations**
2. Check if HTTP integration is configured
3. URL should point to your server: `http://your-server:3000/api/lora`
4. Method should be: **POST**
5. Headers should include: `Content-Type: application/json`

### Step 7: Check ChirpStack Logs

Look at ChirpStack logs for decoding errors:

```bash
# For Docker
docker-compose logs -f chirpstack

# For systemd
sudo journalctl -u chirpstack -f

# Look for errors like:
# - "decode error"
# - "javascript error"
# - "codec error"
```

### Step 8: Create New Device Profile (Nuclear Option)

If nothing works, create a fresh device profile:

1. Go to: **Tenant → Device Profiles**
2. Click **"Add device profile"**
3. Name: **"Sensor ABP v2"**
4. Region: **AS923-3** (or your region)
5. MAC version: **1.0.3** (or match your device)
6. Regional parameters: **A** (or match your device)
7. Supports OTAA: **Unchecked** (you're using ABP)
8. Device supports Class B/C: **Unchecked** (Class A only)
9. Go to **"Codec"** tab
10. Paste the ENTIRE codec from `CHIRPSTACK_CODEC_CORRECTED.js`
11. Click **"Submit"**
12. Go back to your device
13. Change its Device Profile to **"Sensor ABP v2"**

## Verification Checklist

After deployment, verify at each layer:

### Layer 1: Python Script
```
✅ Sensor log shows: {'type': 'reading', 'nodeID': 2, ...}
```

### Layer 2: ChirpStack Raw Data
1. Go to ChirpStack Events
2. Check `data` field (base64)
3. Decode manually:
```bash
echo "eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6Mi..." | base64 -d
```
4. Should show: `{"type":"reading","nodeID":2,...}`

### Layer 3: ChirpStack Decoded Object
1. In ChirpStack Events
2. Check `object` field
3. Should show:
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {...}
}
```
**If this is missing type/nodeID, codec isn't working!**

### Layer 4: Server Logs
```
✅ Server logs show: { type: 'reading', nodeID: 2, ... }
```

## Common Issues and Solutions

### Issue 1: Codec Tab Missing

**Problem:** Can't find "Codec" tab in Device Profile or Application

**Solution:** 
- You're looking in the wrong place
- In ChirpStack v4, codecs are in Device Profile
- Navigate: Tenant → Device Profiles → [Your Profile] → Codec

### Issue 2: Test Works But Real Packets Don't

**Problem:** Test decoder works, but real uplinks still show old format

**Solution:**
- ChirpStack caching issue
- Restart ChirpStack: `docker-compose restart chirpstack`
- Wait 1-2 minutes for restart
- Send new packet from sensor

### Issue 3: Codec Keeps Reverting

**Problem:** After saving codec, it reverts to old version

**Solution:**
- Browser cache issue
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Or use incognito/private browsing mode
- Save codec again
- Verify it saved by refreshing page

### Issue 4: JavaScript Syntax Error

**Problem:** Codec has syntax error but ChirpStack doesn't show clear error

**Solution:**
- Copy codec to a JavaScript file
- Run through linter: https://jshint.com/
- Fix any syntax errors
- Re-paste into ChirpStack

### Issue 5: Wrong Device Profile

**Problem:** Device is using a different device profile than you think

**Solution:**
- Check device configuration
- Note the actual Device Profile name
- Update codec in THAT profile
- Or change device to use correct profile

### Issue 6: Multiple Devices with Different Profiles

**Problem:** Have multiple devices, each using different profiles

**Solution:**
- Update codec in ALL device profiles
- Or standardize all devices to use one profile
- Recommended: Create one profile with correct codec, use for all devices

## Debug Script

Create a test script to verify ChirpStack is receiving data:

```bash
#!/bin/bash
# Save as test_chirpstack.sh

echo "Testing ChirpStack codec deployment..."

# Test 1: Check if ChirpStack is running
echo "1. Checking ChirpStack status..."
docker-compose ps chirpstack || systemctl status chirpstack

# Test 2: Check logs for errors
echo "2. Checking logs for codec errors..."
docker-compose logs --tail=50 chirpstack | grep -i "decode\|codec\|error"

# Test 3: Send test HTTP request (if HTTP integration is set up)
echo "3. Testing HTTP integration..."
curl -X POST http://localhost:3000/api/lora \
  -H "Content-Type: application/json" \
  -d '{
    "received_at": "2025-12-14T17:00:00Z",
    "object": {
      "type": "reading",
      "nodeID": 2,
      "data": {
        "temp_humid": {"temperature": 26.0, "humidity": 62.4},
        "gas": {"co_ppm": 2.9},
        "gps": {"latitude": null, "longitude": null, "altitude": null, "fix": false}
      }
    }
  }'

echo ""
echo "If test 3 works, server is fine. Problem is ChirpStack codec."
```

## Success Criteria

You'll know the codec is working when:

1. ✅ ChirpStack test function shows correct output
2. ✅ ChirpStack Events `object` field has `type` and `nodeID`
3. ✅ Server logs show `type: 'reading'` and `nodeID: 2`
4. ✅ Database stores readings
5. ✅ Dashboard displays data

## Still Not Working?

If you've tried everything and it still doesn't work:

1. **Export current codec:**
   - Copy entire codec from ChirpStack
   - Save to file: `current_codec.js`
   - Compare with `CHIRPSTACK_CODEC_CORRECTED.js`
   - Look for differences

2. **Check ChirpStack version:**
   ```bash
   docker-compose exec chirpstack chirpstack --version
   ```
   - Codec syntax might differ between versions
   - This codec is for ChirpStack v4

3. **Ask for ChirpStack Events JSON:**
   - Copy the entire JSON from an uplink event
   - Check what `object` field contains
   - This shows exactly what the codec is returning

4. **Provide more details:**
   - ChirpStack version
   - Full ChirpStack Events JSON
   - Full codec from ChirpStack (not from file)
   - Device Profile configuration
   - Any error messages

---

**Most Likely Cause:** Codec is in wrong location (Application instead of Device Profile) or wasn't saved correctly.

**Quick Fix:** Go to Device Profile → Codec, paste entire codec, save, restart ChirpStack, test.
