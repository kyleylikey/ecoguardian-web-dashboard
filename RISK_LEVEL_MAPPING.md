# Risk Level Mapping Fix

## Issue Resolved

**Error**: `SQLITE_CONSTRAINT: CHECK constraint failed: fire_risklvl IN ('low','medium','high')`

This error occurred because of a type mismatch between what the Python script sends and what the database expects.

## Root Cause

### Database Schema
```sql
fire_risklvl TEXT CHECK(fire_risklvl IN ('low','medium','high'))
```
**Expects**: TEXT values: `'low'`, `'medium'`, `'high'`

### Python Script Sends
```python
alert_payload = {
    "risk_type": "chainsaw",
    "risk_level": 1,  # INTEGER!
    "confidence": 87.3
}
```
**Sends**: INTEGER values: `1`, `2`, `3`

### Result
❌ Database rejects the INSERT because `1` is not in `('low','medium','high')`

## Solution Implemented

Added automatic mapping in `server/routes/lora.js` (commit 09c32c2):

```javascript
// Map integer risk_level to TEXT for database compatibility
let fire_risklvl = null;
if (risk_level !== null && risk_level !== undefined) {
  if (typeof risk_level === 'number') {
    // Map integer to TEXT
    const levelMap = { 1: 'low', 2: 'medium', 3: 'high' };
    fire_risklvl = levelMap[risk_level] || null;
  } else if (typeof risk_level === 'string') {
    // Already TEXT, validate it
    if (['low', 'medium', 'high'].includes(risk_level)) {
      fire_risklvl = risk_level;
    }
  }
}
```

## How It Works

### Mapping Table

| Python Sends | Server Maps To | Database Stores |
|--------------|----------------|-----------------|
| `1` (integer) | `'low'` (TEXT) | ✅ Accepted |
| `2` (integer) | `'medium'` (TEXT) | ✅ Accepted |
| `3` (integer) | `'high'` (TEXT) | ✅ Accepted |
| `'low'` (TEXT) | `'low'` (TEXT) | ✅ Accepted |
| `'medium'` (TEXT) | `'medium'` (TEXT) | ✅ Accepted |
| `'high'` (TEXT) | `'high'` (TEXT) | ✅ Accepted |
| `null` | `null` | ✅ Accepted (nullable) |
| `0` or `4+` | `null` | ✅ Accepted (invalid mapped to null) |
| `'invalid'` | `null` | ✅ Accepted (invalid mapped to null) |

## Risk Level Meanings

Based on Python script usage:

### Chainsaw Alerts (logging detection)
- Python sends: `risk_level: 1`
- Server maps to: `'low'`
- Meaning: Illegal logging activity detected

### Gunshot Alerts (poaching detection)
- Python sends: `risk_level: 2`
- Server maps to: `'medium'`
- Meaning: Poaching activity detected

### Fire Alerts (sensor threshold)
- Python sends: `risk_level: 3`
- Server maps to: `'high'`
- Meaning: Critical fire conditions detected

## Benefits of This Approach

### ✅ Backward Compatible
- Python script doesn't need changes
- Works with both integer and TEXT values
- Handles edge cases gracefully

### ✅ Database Compliant
- Satisfies CHECK constraint
- Stores semantic TEXT values
- Easy to query and understand

### ✅ Flexible
- Can update Python script to send TEXT later
- Server will handle both formats
- No breaking changes

## Python Script Recommendation (Optional)

While not required, the Python script could be updated to send TEXT values directly:

```python
# Current (works with mapping)
alert_payload = {
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 87.3
}

# Recommended (more semantic)
alert_payload = {
    "risk_type": "chainsaw",
    "risk_level": "low",  # TEXT instead of integer
    "confidence": 87.3
}
```

Benefits:
- More self-documenting
- No mapping needed (but server still supports it)
- Matches database schema directly

## Testing

### Before Fix (Error)
```
📥 Received LoRa payload: { type: 'alert', nodeID: 2, rssi: undefined, snr: undefined }
📊 Processing 1 risk(s)...
❌ Error processing LoRa message: Error: SQLITE_CONSTRAINT: CHECK constraint failed: fire_risklvl IN ('low','medium','high')
```

### After Fix (Success)
```
📥 Received LoRa payload: { type: 'alert', nodeID: 2, rssi: undefined, snr: undefined }
📊 Processing 1 risk(s)...
🪚 NEW chainsaw incident started - riskID: 1
📤 Broadcasted 1 risk(s)
```

## Database Query Examples

### Check Risk Levels
```sql
-- See all risk levels in database
SELECT DISTINCT fire_risklvl FROM Risks;

-- Expected output: 'low', 'medium', 'high', NULL
```

### Query by Risk Level
```sql
-- Find all high-severity risks
SELECT * FROM Risks WHERE fire_risklvl = 'high';

-- Find chainsaw alerts (typically 'low')
SELECT * FROM Risks WHERE risk_type = 'chainsaw' AND fire_risklvl = 'low';

-- Find fire alerts (typically 'high')
SELECT * FROM Risks WHERE risk_type = 'fire' AND fire_risklvl = 'high';
```

## Related Files

- **Server Code**: `server/routes/lora.js` (lines 141-156)
- **Database Schema**: `server/db/db.js` (line 47)
- **Python Script**: See problem statement (lines 434-456)
- **Documentation**: `CODEC_VERIFICATION.md`, `INTEGRATION_SUMMARY.md`

## Verification Checklist

After the fix, verify:

- [ ] Alerts process without SQLITE_CONSTRAINT error
- [ ] Database stores 'low', 'medium', or 'high' (not integers)
- [ ] Dashboard displays alerts correctly
- [ ] WebSocket broadcasts alert events
- [ ] Python script continues to work without changes

## Troubleshooting

### Still Getting Constraint Error?

1. **Restart server** to load new code:
   ```bash
   cd server
   npm start
   ```

2. **Check server code** has the mapping:
   ```bash
   grep -A10 "levelMap" server/routes/lora.js
   ```

3. **Test with curl**:
   ```bash
   curl -X POST http://localhost:3000/api/lora \
     -H "Content-Type: application/json" \
     -d '{
       "received_at": "2025-12-14T16:30:00Z",
       "object": {
         "type": "alert",
         "nodeID": 2,
         "risk_type": "chainsaw",
         "risk_level": 1,
         "confidence": 87.3
       }
     }'
   ```

4. **Check database**:
   ```sql
   SELECT fire_risklvl FROM Risks ORDER BY riskID DESC LIMIT 1;
   -- Should show 'low', not 1
   ```

### Invalid Values?

If you see `null` in database for risk_level:
- Check Python script sends valid values (1, 2, 3)
- Check codec passes values through correctly
- Check server logs for mapping debug info

## Summary

- **Problem**: Database expects TEXT, Python sends INTEGER
- **Solution**: Server automatically maps integers to TEXT
- **Status**: ✅ Fixed in commit 09c32c2
- **Action**: None required - mapping is automatic
- **Benefit**: Python script and codec work as-is

---

**Last Updated**: 2025-12-14  
**Fix Commit**: 09c32c2  
**Status**: ✅ Resolved
