# Real Sensor Node Troubleshooting

## Issue

Tests pass (manual curl tests work), but real sensor nodes still show:
```
📥 Received LoRa payload: { type: undefined, nodeID: undefined, rssi: -84, snr: 12 }
```

## Root Cause Analysis

This indicates that:
- ✅ The corrected codec IS deployed (manual tests work)
- ❌ The Python script is NOT sending the expected JSON format
- ❌ The real sensor packets don't contain `type` and `nodeID` fields

## Problem: Python Script JSON Format

### What the Codec Expects

The codec expects JSON in this format:
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

### What Your Python Script May Be Sending

Looking at your Python script, the issue is likely in the `prepare_lora_packet_json()` function. Let me check what it's actually creating...

The Python script you provided appears to be incomplete (cuts off at "AUDIO_HISTORY =..."), but based on the problem statement, your script likely has a `prepare_lora_packet_json()` function that needs to construct the JSON with `type` and `nodeID` fields.

## Diagnostic Steps

### Step 1: Check What JSON the Python Script is Sending

Add debug output to your Python script to see the actual JSON being sent:

```python
def prepare_lora_packet_json(data, is_alert=False):
    """
    Serializes the packet based on whether it is a regular reading or an alert.
    The structure MUST match the ChirpStack decoder.
    """
    global frame_counter

    if is_alert:
        packet = {
            "type": "alert",           # ⬅️ MUST be present
            "nodeID": 2,               # ⬅️ MUST be present
            "risk_type": data["risk_type"],
            "risk_level": data["risk_level"] if data.get("risk_level") else None,
            "confidence": data["confidence"] if data.get("confidence") else None
        }
    else:
        # Structure for READING type
        th = data.get("temp_humid") or {}
        gas = data.get("gas") or {}
        gps = data.get("gps") or {}

        packet = {
            "type": "reading",         # ⬅️ MUST be present
            "nodeID": 2,               # ⬅️ MUST be present
            "temp": th.get("temperature"),
            "humidity": th.get("humidity"),
            "co_ppm": gas.get("co_ppm"),
            "latitude": gps.get("latitude"),
            "longitude": gps.get("longitude"),
            "altitude": gps.get("altitude"),
            "gps_fix": bool(gps.get("fix", False))
        }

    json_bytes = json.dumps(packet, separators=(',', ':')).encode('utf-8')
    
    # ⬅️ ADD THIS DEBUG OUTPUT
    print(f"\n📤 JSON being sent: {packet}")
    print(f"   Raw JSON string: {json.dumps(packet, separators=(',', ':'))}")
    print(f"   JSON bytes length: {len(json_bytes)}")
    
    # ... rest of function
```

### Step 2: Check ChirpStack Decoding

When your sensor sends a packet:

1. Go to ChirpStack → Applications → EcoGuardian Network → Devices → SensorNode02
2. Click on "Events" tab
3. Look at the latest uplink event
4. Check the `data` field (base64 encoded)
5. Check the `object` field (decoded by your codec)

**What you should see:**

```json
{
  "data": "eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6Mi...",  // base64 encoded
  "object": {
    "type": "reading",     // ⬅️ Should be here!
    "nodeID": 2,           // ⬅️ Should be here!
    "data": {
      "temp_humid": {...},
      "gas": {...},
      "gps": {...}
    }
  }
}
```

**If `object` doesn't have `type` and `nodeID`:**

The Python script isn't including them in the JSON being sent.

### Step 3: Decode the Base64 Data Manually

In ChirpStack Events, copy the `data` field value and decode it:

```bash
echo "eyJ0eXBlIjoicmVhZGluZyIsIm5vZGVJRCI6Mi..." | base64 -d
```

This will show you the actual JSON string being sent. Check if it includes `type` and `nodeID`.

## Common Issues

### Issue 1: Python Script Not Including type/nodeID

**Problem:** The `prepare_lora_packet_json()` function doesn't include these fields.

**Solution:** Update the Python script to always include:
```python
packet = {
    "type": "reading",  # or "alert"
    "nodeID": 2,        # your node ID
    # ... other fields
}
```

### Issue 2: JSON Structure is Wrong

**Problem:** Python script creates nested structure instead of flat.

**Wrong:**
```python
packet = {
    "data": {  # ❌ Extra wrapper
        "type": "reading",
        "nodeID": 2,
        # ...
    }
}
```

**Correct:**
```python
packet = {
    "type": "reading",  # ✅ At root level
    "nodeID": 2,        # ✅ At root level
    "temp": 25.5,       # ✅ At root level
    # ...
}
```

### Issue 3: Fields are Named Differently

**Problem:** Python uses different field names than codec expects.

**Check that Python sends:**
- `type` (not `packet_type` or `msg_type`)
- `nodeID` (not `node_id` or `sensor_id`)
- `temp` (not `temperature`)
- `gps_fix` (not `fix`)

## Fix for Python Script

Based on the problem statement, here's what your `prepare_lora_packet_json()` should look like:

```python
def prepare_lora_packet_json(data, is_alert=False):
    """
    Serializes the packet based on whether it is a regular reading or an alert.
    The structure MUST match the ChirpStack decoder.
    """
    global frame_counter

    if is_alert:
        # Structure for ALERT type (matches your decoder's alert path)
        packet = {
            "type": "alert",
            "nodeID": 2,
            "risk_type": data["risk_type"],
            "risk_level": data["risk_level"] if data.get("risk_level") else None,
            "confidence": data["confidence"] if data.get("confidence") else None
        }
    else:
        # Structure for READING type (matches your decoder's reading path)
        th = data.get("temp_humid") or {}
        gas = data.get("gas") or {}
        gps = data.get("gps") or {}

        packet = {
            "type": "reading",
            "nodeID": 2,
            "temp": th.get("temperature"),
            "humidity": th.get("humidity"),
            "co_ppm": gas.get("co_ppm"),
            "latitude": gps.get("latitude"),
            "longitude": gps.get("longitude"),
            "altitude": gps.get("altitude"),
            "gps_fix": bool(gps.get("fix", False))
        }

    json_bytes = json.dumps(packet, separators=(',', ':')).encode('utf-8')

    # --- LoRaWAN Sending Logic ---
    if len(json_bytes) > 200:
        print(f"[LoRa][WARN] JSON payload length {len(json_bytes)} bytes — may exceed max FRMPayload for your DR.")

    print(f"\n📡 LoRa JSON Packet Ready (Type: {packet['type']}):", packet)
    print(f"   JSON bytes len: {len(json_bytes)} hex: {json_bytes.hex()}")

    try:
        send_data_packet(json_bytes)
    except Exception as e:
        print(f"[LoRa] Error sending JSON packet: {e}")

    return packet
```

**Key points:**
1. ✅ `type` at root level
2. ✅ `nodeID` at root level
3. ✅ For readings: flat structure with `temp`, `humidity`, `co_ppm`, etc.
4. ✅ For alerts: flat structure with `risk_type`, `risk_level`, `confidence`

## Verification Checklist

After fixing the Python script:

- [ ] Add debug output to see JSON being sent
- [ ] Restart Python script
- [ ] Wait for next packet (10 seconds)
- [ ] Check Python console output - should show `type` and `nodeID` in the packet
- [ ] Check ChirpStack Events - `object` field should have `type` and `nodeID`
- [ ] Check server logs - should show `type: 'reading'` and `nodeID: 2`
- [ ] Check database - readings should be stored

## Expected Output After Fix

### Python Console:
```
📡 LoRa JSON Packet Ready (Type: reading): {
  'type': 'reading',
  'nodeID': 2,
  'temp': 25.6,
  'humidity': 67.3,
  'co_ppm': 3.4,
  ...
}
```

### ChirpStack Events:
```json
{
  "object": {
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": {"temperature": 25.6, "humidity": 67.3},
      "gas": {"co_ppm": 3.4},
      "gps": {...}
    }
  }
}
```

### Server Logs:
```
📥 Received LoRa payload: { type: 'reading', nodeID: 2, rssi: -84, snr: 12 }
✅ Reading saved - readingID: 16
```

## Quick Summary

**Problem:** Python script isn't sending `type` and `nodeID` in the JSON.

**Solution:** Update `prepare_lora_packet_json()` to include these fields at the root level of the JSON object.

**Test:** Add debug output, restart script, check all three layers (Python, ChirpStack, Server).

---

**Status**: Awaiting Python script fix  
**Next Step**: Update `prepare_lora_packet_json()` function in your Python script
