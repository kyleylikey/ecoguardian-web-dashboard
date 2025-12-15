# ChirpStack Codec Comparison: Before vs After

## Visual Comparison

### 🔴 ORIGINAL CODEC (BROKEN)

```javascript
// Original decoder function
function decodeUplink(input) {
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData.type === "reading") {
    return {
      data: {                    // ❌ EXTRA WRAPPER
        type: jsonData.type,
        nodeID: jsonData.nodeID,
        data: { ... }
      }
    };
  }
}
```

**ChirpStack sends to server:**
```json
{
  "deviceInfo": { ... },
  "received_at": "2025-12-14T15:30:00Z",
  "object": {
    "data": {              ← ChirpStack puts decoded data here
      "type": "reading",   ← But decoder wrapped it again!
      "nodeID": 2,
      "data": { ... }
    }
  }
}
```

**Server code tries to access:**
```javascript
const payload = req.body?.object;  // Gets: { data: { type, nodeID, data } }
const { type, nodeID, data } = payload;  // Tries to destructure from root

// Result:
type = undefined     // ❌ Actually at payload.data.type
nodeID = undefined   // ❌ Actually at payload.data.nodeID  
data = { type, nodeID, data }  // ❌ Gets the wrapper instead
```

**💥 RESULT: COMPLETE FAILURE - No data is stored!**

---

### 🟢 CORRECTED CODEC (WORKING)

```javascript
// Corrected decoder function
function decodeUplink(input) {
  var jsonData = JSON.parse(jsonString);
  
  if (jsonData.type === "reading") {
    return {                     // ✅ NO EXTRA WRAPPER
      type: jsonData.type,       // ✅ Direct properties
      nodeID: jsonData.nodeID,
      data: { ... }
    };
  }
}
```

**ChirpStack sends to server:**
```json
{
  "deviceInfo": { ... },
  "received_at": "2025-12-14T15:30:00Z",
  "object": {            ← ChirpStack puts decoded data here
    "type": "reading",   ← Decoder returns properties at root ✅
    "nodeID": 2,
    "data": { ... }
  }
}
```

**Server code accesses:**
```javascript
const payload = req.body?.object;  // Gets: { type, nodeID, data }
const { type, nodeID, data } = payload;  // Destructures correctly

// Result:
type = "reading"     // ✅ Found at payload.type
nodeID = 2           // ✅ Found at payload.nodeID
data = { temp_humid, gas, gps }  // ✅ Gets actual sensor data
```

**✅ RESULT: SUCCESS - All data is stored correctly!**

---

## Side-by-Side: Reading Packet

### Input (from Python Script)
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

### 🔴 Original Codec Output
```json
{
  "data": {                    ← ❌ Extra wrapper
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": { "temperature": 25.5, "humidity": 60 },
      "gas": { "co_ppm": 5.1 },
      "gps": { "latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true }
    }
  }
}
```

**Server receives in req.body.object:**
```json
{
  "data": {              ← Gets the wrapper
    "type": "reading",   ← Can't access this
    "nodeID": 2,         ← Can't access this
    "data": { ... }      ← Can't access this
  }
}
```

### 🟢 Corrected Codec Output
```json
{
  "type": "reading",         ← ✅ Direct property
  "nodeID": 2,               ← ✅ Direct property
  "data": {                  ← ✅ Direct property
    "temp_humid": { "temperature": 25.5, "humidity": 60 },
    "gas": { "co_ppm": 5.1 },
    "gps": { "latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true }
  }
}
```

**Server receives in req.body.object:**
```json
{
  "type": "reading",     ← ✅ Accessible
  "nodeID": 2,           ← ✅ Accessible
  "data": { ... }        ← ✅ Accessible
}
```

---

## Side-by-Side: Alert Packet

### Input (from Python Script)
```json
{
  "type": "alert",
  "nodeID": 2,
  "risk_type": "chainsaw",
  "risk_level": 1,
  "confidence": 87.3
}
```

### 🔴 Original Codec Output
```json
{
  "data": {                  ← ❌ Extra wrapper
    "type": "alert",
    "nodeID": 2,
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 87.3
  }
}
```

**What happens:**
```javascript
const { type, nodeID } = payload;
// type = undefined ❌
// nodeID = undefined ❌

if (type === "alert") {  // Never executes!
  // Alert processing code is never reached
}
```

### 🟢 Corrected Codec Output
```json
{
  "type": "alert",           ← ✅ Direct property
  "nodeID": 2,               ← ✅ Direct property
  "risk_type": "chainsaw",   ← ✅ Direct property
  "risk_level": 1,           ← ✅ Direct property
  "confidence": 87.3         ← ✅ Direct property
}
```

**What happens:**
```javascript
const { type, nodeID } = payload;
// type = "alert" ✅
// nodeID = 2 ✅

if (type === "alert") {  // Executes correctly!
  const { risk_type, risk_level, confidence } = payload;
  // All values accessible ✅
}
```

---

## Database Impact

### 🔴 With Original Codec

**Readings Table:**
```
readingID | nodeID | temperature | humidity | co_level | timestamp
----------|--------|-------------|----------|----------|----------
(empty - no data stored)
```

**Risks Table:**
```
riskID | nodeID | risk_type | confidence | timestamp
-------|--------|-----------|------------|----------
(empty - no alerts stored)
```

**Why?**
- `type` is undefined → server doesn't know if it's a reading or alert
- `nodeID` is undefined → can't associate with sensor node
- `data` contains the wrapper → can't extract sensor values
- Database inserts fail or insert NULL values

### 🟢 With Corrected Codec

**Readings Table:**
```
readingID | nodeID | temperature | humidity | co_level | timestamp
----------|--------|-------------|----------|----------|-------------------
1         | 2      | 25.5        | 60.0     | 5        | 2025-12-14 15:30:00
```

**Risks Table:**
```
riskID | nodeID | risk_type | confidence | timestamp
-------|--------|-----------|------------|-------------------
1      | 2      | chainsaw  | 87.3       | 2025-12-14 15:31:00
```

**Why?**
- `type` is accessible → server routes correctly
- `nodeID` is accessible → proper node association
- `data` contains sensor values → extracts correctly
- Database inserts succeed with correct values

---

## Code Path Comparison

### 🔴 Original Codec: Failed Path

```
Python sends JSON
    ↓
LoRa transmission
    ↓
ChirpStack decoder (wraps in extra 'data')
    ↓
HTTP POST to /api/lora
    ↓
Server: const payload = req.body.object
         // payload = { data: { type, nodeID, data } }
    ↓
Server: const { type, nodeID, data } = payload
         // type = undefined
         // nodeID = undefined
         // data = { type, nodeID, data }
    ↓
Server: if (type === "alert") { ... }
         // ❌ Never executes (type is undefined)
    ↓
Server: else if (type === "reading") { ... }
         // ❌ Never executes (type is undefined)
    ↓
💥 ERROR: No data processed, no database insert, no WebSocket broadcast
```

### 🟢 Corrected Codec: Success Path

```
Python sends JSON
    ↓
LoRa transmission
    ↓
ChirpStack decoder (returns flat structure)
    ↓
HTTP POST to /api/lora
    ↓
Server: const payload = req.body.object
         // payload = { type, nodeID, data }
    ↓
Server: const { type, nodeID, data } = payload
         // type = "reading"
         // nodeID = 2
         // data = { temp_humid, gas, gps }
    ↓
Server: if (type === "reading") { ... }
         // ✅ Executes correctly
    ↓
Server: INSERT INTO Readings (nodeID, temperature, ...)
         VALUES (2, 25.5, ...)
    ↓
Database: ✅ Data stored
    ↓
WebSocket: ✅ Dashboard updated
    ↓
✅ SUCCESS: Complete data pipeline working
```

---

## How to Fix

### Step 1: Open ChirpStack Application Settings

Navigate to: **ChirpStack Console → Applications → [Your App] → Codec**

### Step 2: Replace Decoder Function

Delete the current decoder and paste the corrected version from `CHIRPSTACK_CODEC_CORRECTED.js`

### Step 3: Test

Use the built-in test function in ChirpStack:

**Test Input (reading):**
```
{"type":"reading","nodeID":2,"temp":25.5,"humidity":60,"co_ppm":5.1,"latitude":14.5995,"longitude":120.9842,"altitude":50,"gps_fix":true}
```

**Expected Output:**
```json
{
  "type": "reading",
  "nodeID": 2,
  "data": {
    "temp_humid": { "temperature": 25.5, "humidity": 60 },
    "gas": { "co_ppm": 5.1 },
    "gps": { "latitude": 14.5995, "longitude": 120.9842, "altitude": 50, "fix": true }
  }
}
```

**NOT:**
```json
{
  "data": {    ← If you see this, you're still using the broken codec!
    "type": "reading",
    ...
  }
}
```

### Step 4: Verify End-to-End

```bash
# Run the test suite
./test_integration.sh

# Check dashboard
# Open http://localhost:5173 and verify readings appear
```

---

## Summary

| Aspect | Original Codec | Corrected Codec |
|--------|----------------|-----------------|
| **Structure** | Nested in extra 'data' | Flat at root level |
| **Server Compatibility** | ❌ Broken | ✅ Working |
| **Database Storage** | ❌ No data stored | ✅ All data stored |
| **WebSocket Updates** | ❌ No broadcasts | ✅ Real-time updates |
| **Dashboard Display** | ❌ No data shown | ✅ All data visible |
| **Alert Handling** | ❌ Alerts ignored | ✅ Alerts processed |
| **Production Ready** | ❌ No | ✅ Yes |

## The Bottom Line

**Original codec**: Extra `data` wrapper breaks everything  
**Corrected codec**: Returns structure server expects, everything works

**Action Required**: Deploy `CHIRPSTACK_CODEC_CORRECTED.js` to ChirpStack
