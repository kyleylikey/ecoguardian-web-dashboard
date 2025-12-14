# Python Script Risk Type Mapping Fix

## Issue

The Python sensor script sends risk types that don't match the database schema:

**Python sends:**
- `risk_type: "logging"` (for chainsaw detection)
- `risk_type: "poaching"` (for gunshot detection)

**Database accepts:**
- `risk_type` must be one of: `'fire'`, `'chainsaw'`, `'gunshots'`

**Result:** Database constraint violation - alerts are rejected!

## Root Cause

The Python script (around line 434) directly uses the audio classification labels:

```python
if persistent_audio_risk != "none":
    alert_payload = {
        "risk_type": persistent_audio_risk,  # ❌ "logging" or "poaching"
        "risk_level": 1 if persistent_audio_risk == "logging" else 2,
        "confidence": audio_result.get("confidence")
    }
```

The function `check_audio_persistence()` returns "logging" or "poaching" from the audio model labels, but these don't match database values.

## Solution

Add a mapping layer to convert activity types to technical risk types:

```python
# Add this near the top of the file, after imports or with other constants

# Map audio classification labels to database-compatible risk types
AUDIO_RISK_TYPE_MAPPING = {
    "logging": "chainsaw",   # Illegal logging detected via chainsaw sounds
    "poaching": "gunshots"   # Poaching activity detected via gunshot sounds
}
```

Then update the alert preparation code (around line 434):

```python
# --- Check Audio Persistence Threshold (60% of last 10s) ---
persistent_audio_risk = check_audio_persistence(
    audio_result.get("risk_level"), AUDIO_HISTORY
)

# Prioritize alert packets
if persistent_audio_risk != "none":
    # Audio Alert: Logging or Poaching
    # Map to database-compatible risk type
    db_risk_type = AUDIO_RISK_TYPE_MAPPING.get(persistent_audio_risk, persistent_audio_risk)
    
    alert_payload = {
        "risk_type": db_risk_type,  # ✅ "chainsaw" or "gunshots"
        "risk_level": 1 if persistent_audio_risk == "logging" else 2,
        "confidence": audio_result.get("confidence")
    }
    prepare_lora_packet_json(alert_payload, is_alert=True)
    print(f"!!! 🚨 CRITICAL AUDIO ALERT: {persistent_audio_risk.upper()} (DB: {db_risk_type})")
    last_lora_send = current_time
```

## Alternative: Update check_audio_persistence()

Instead of mapping after the function, you could change the function itself:

```python
def check_audio_persistence(current_audio_risk_level, history):
    """
    Checks if 'logging' or 'poaching' has been detected in at least 30% of the last 10 readings.
    Returns the detected risk level in database-compatible format (chainsaw/gunshots) or "none".
    """

    # 1. Update History
    history.append(current_audio_risk_level)
    while len(history) > HISTORY_LENGTH:
        history.pop(0)

    # We must have enough data points to check persistence
    if len(history) < HISTORY_LENGTH:
        return "none"

    # 2. Check Persistence
    logging_count = history.count("logging")
    poaching_count = history.count("poaching")

    required_count = len(history) * (PERSISTENCE_THRESHOLD_PCT / 100.0)

    # ✅ Return database-compatible risk types
    if logging_count >= required_count and logging_count > poaching_count:
        return "chainsaw"  # Changed from "chainsaw" (was returning "chainsaw" in comment but code had it)
    elif poaching_count >= required_count and poaching_count > logging_count:
        return "gunshots"  # Changed from "poaching" 
    else:
        return "none"
```

**Note:** Looking at the code more carefully, the function already returns "chainsaw" and "gunshots"! Let me re-check...

Actually, looking at line 252 of the Python script:
```python
if logging_count >= required_count and logging_count > poaching_count:
    return "chainsaw"
elif poaching_count >= required_count and poaching_count > logging_count:
    return "gunshots"
```

**Wait!** The function ALREADY returns "chainsaw" and "gunshots"! Let me verify this matches what's being sent...

Looking at line 434:
```python
if persistent_audio_risk != "none":
    alert_payload = {
        "risk_type": persistent_audio_risk,  # This should already be "chainsaw" or "gunshots"
```

## Re-Analysis

Looking more carefully at the Python script:

1. `check_audio_persistence()` returns: "chainsaw", "gunshots", or "none" ✅
2. The alert payload uses: `"risk_type": persistent_audio_risk` ✅
3. This means it sends: "chainsaw" or "gunshots" ✅

**Actually, the Python script is CORRECT!**

The confusion comes from the variable name `persistent_audio_risk` and the debug print statement which might show the original detection label.

## Verification

Let me trace through the exact flow:

1. **Audio Detection**: Model detects "logging" or "poaching"
2. **Storage**: Stored in `global_audio_result["risk_level"]` as "logging" or "poaching"
3. **Persistence Check**: `check_audio_persistence()` counts occurrences in history
4. **Mapping**: Function returns "chainsaw" for logging, "gunshots" for poaching
5. **Alert Payload**: Uses the mapped value ✅

## Conclusion

**The Python script risk type mapping is actually CORRECT!**

The function `check_audio_persistence()` already performs the mapping:
- Detects "logging" in history → Returns "chainsaw"
- Detects "poaching" in history → Returns "gunshots"

No changes needed to the Python script for risk type compatibility.

## Recommendation

The only potential improvement would be to make the debug output clearer:

```python
if persistent_audio_risk != "none":
    # Audio Alert: Logging or Poaching
    alert_payload = {
        "risk_type": persistent_audio_risk,  # Already "chainsaw" or "gunshots"
        "risk_level": 1 if persistent_audio_risk == "chainsaw" else 2,  # ✅ Use actual value
        "confidence": audio_result.get("confidence")
    }
    prepare_lora_packet_json(alert_payload, is_alert=True)
    
    # ✅ Clearer debug message
    activity = "LOGGING" if persistent_audio_risk == "chainsaw" else "POACHING"
    print(f"!!! 🚨 CRITICAL AUDIO ALERT: {activity} detected (risk_type: {persistent_audio_risk})")
    last_lora_send = current_time
```

This makes it clear that:
- Detection: "LOGGING" or "POACHING" (activity)
- Database: "chainsaw" or "gunshots" (risk_type)
