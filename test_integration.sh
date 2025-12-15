#!/bin/bash

# Test script for ChirpStack integration
# Tests the complete data pipeline from codec output to database storage

API_URL="${API_URL:-http://localhost:3000/api/lora}"
SLEEP_TIME=2

echo "=============================================="
echo "ChirpStack Integration Test Suite"
echo "=============================================="
echo "API Endpoint: $API_URL"
echo "=============================================="

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local payload="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${YELLOW}[Test $TOTAL_TESTS]${NC} $test_name"
    echo "----------------------------------------------"
    
    response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$payload")
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    sleep $SLEEP_TIME
}

# Test 1: Normal Reading
run_test "Normal Reading with All Sensors" '{
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
}'

# Test 2: High Temperature Reading
run_test "High Temperature Reading (Within Normal Range)" '{
  "received_at": "2025-12-14T15:30:10Z",
  "object": {
    "type": "reading",
    "nodeID": 2,
    "data": {
      "temp_humid": {
        "temperature": 35.0,
        "humidity": 45.0
      },
      "gas": {
        "co_ppm": 8.5
      },
      "gps": {
        "latitude": 14.5995,
        "longitude": 120.9842,
        "altitude": 50.5,
        "fix": true
      }
    }
  }
}'

# Test 3: Chainsaw Alert
run_test "Chainsaw Alert (Audio Detection)" '{
  "received_at": "2025-12-14T15:31:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "chainsaw",
    "risk_level": 1,
    "confidence": 87.3
  }
}'

# Test 4: Gunshot Alert
run_test "Gunshot Alert (Audio Detection)" '{
  "received_at": "2025-12-14T15:32:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "gunshots",
    "risk_level": 2,
    "confidence": 91.8
  }
}'

# Test 5: Fire Alert
run_test "Fire Alert (Sensor Threshold)" '{
  "received_at": "2025-12-14T15:33:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "fire",
    "risk_level": 3,
    "confidence": null
  }
}'

# Test 6: Reading without GPS Fix
run_test "Reading Without GPS Fix" '{
  "received_at": "2025-12-14T15:34:00Z",
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
}'

# Test 7: Multiple Readings (Cooldown Test)
echo -e "\n${YELLOW}[Test Set]${NC} Testing Cooldown Mechanism"
echo "----------------------------------------------"
echo "Sending 5 consecutive readings to test incident cooldown..."

for i in {1..5}; do
    run_test "Cooldown Reading $i/5" '{
      "received_at": "2025-12-14T15:35:'$(printf "%02d" $((i*10)))'.000Z",
      "object": {
        "type": "reading",
        "nodeID": 2,
        "data": {
          "temp_humid": {
            "temperature": 23.5,
            "humidity": 65.0
          },
          "gas": {
            "co_ppm": 4.0
          },
          "gps": {
            "latitude": 14.5995,
            "longitude": 120.9842,
            "altitude": 50.5,
            "fix": true
          }
        }
      }
    }'
done

# Test 8: Concurrent Alerts (Multiple Risk Types)
run_test "Fire Alert While Other Incidents Active" '{
  "received_at": "2025-12-14T15:36:00Z",
  "object": {
    "type": "alert",
    "nodeID": 2,
    "risk_type": "fire",
    "risk_level": 3,
    "confidence": null
  }
}'

# Test 9: Different Node
run_test "Reading from Different Node (nodeID=3)" '{
  "received_at": "2025-12-14T15:37:00Z",
  "object": {
    "type": "reading",
    "nodeID": 3,
    "data": {
      "temp_humid": {
        "temperature": 22.0,
        "humidity": 70.0
      },
      "gas": {
        "co_ppm": 3.5
      },
      "gps": {
        "latitude": 14.6000,
        "longitude": 120.9850,
        "altitude": 55.0,
        "fix": true
      }
    }
  }
}'

# Summary
echo ""
echo "=============================================="
echo "Test Summary"
echo "=============================================="
echo -e "Total Tests:  $TOTAL_TESTS"
echo -e "${GREEN}Passed:       $PASSED_TESTS${NC}"
echo -e "${RED}Failed:       $FAILED_TESTS${NC}"
echo "=============================================="

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Check the dashboard to verify data appears correctly"
    echo "2. Check database: sqlite3 server/db/eco.db 'SELECT * FROM Readings ORDER BY timestamp DESC LIMIT 5;'"
    echo "3. Verify alerts appear in the alerts panel"
    echo "4. Check WebSocket events in browser console"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Check if server is running: curl http://localhost:3000/health"
    echo "2. Check server logs for errors"
    echo "3. Verify database is accessible"
    echo "4. Check if nodeID 2 and 3 exist in SensorNodes table"
    exit 1
fi
