import * as React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  useTheme,
  Modal,
  Button,
  Chip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { tokens } from "../theme";
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ParkIcon from '@mui/icons-material/Park';
import PetsIcon from '@mui/icons-material/Pets';
import { useWebSocket } from "../hooks/useWebSocket";

const ActiveAlerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage } = useWebSocket(WS_URL);

  const [open, setOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState(null);
  const [selectedAlertReadings, setSelectedAlertReadings] = React.useState([]);
  const [elapsed, setElapsed] = React.useState("00");
  const [activeAlerts, setActiveAlerts] = React.useState([]);
  const [resolving, setResolving] = React.useState(false);

  // Format confidence
  const formatConfidence = (c) => {
    if (c === null || c === undefined) return "N/A";
    const n = Number(c);
    if (!isNaN(n)) return n <= 1 ? `${(n * 100).toFixed(1)}%` : String(n);
    return String(c);
  };

  // Map backend risk to UI alert
  const mapRisk = (r) => {
    const typeMap = { 
      fire: "Wildfire Risk", 
      chainsaw: "Illegal Logging", 
      gunshots: "Poaching" 
    };
    const severityMap = { 
      high: "High", 
      medium: "Moderate", 
      low: "Low" 
    };

    return {
      id: r.riskID,
      type: typeMap[r.risk_type] || "Unknown",
      node: r.nodeName || `Node ${r.nodeID}`,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      severity: severityMap[String(r.fire_risklvl || "").toLowerCase()] || "N/A",
      confidence: r.confidence,
      status: r.resolved_at ? "Resolved" : "Active",
      resolved_at: r.resolved_at,
      risk_type: r.risk_type,
      is_incident_start: r.is_incident_start,
      cooldown_counter: r.cooldown_counter,
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      incidentTimestamp: r.timestamp, // For grouping fire incidents
    };
  };

  // Open modal and fetch readings
  const handleOpen = async (alert) => {
    setSelectedAlert(alert);
    setOpen(true);

    // For fire risks, fetch all alerts in the incident
    if (alert.risk_type === "fire") {
      try {
        const res = await fetch(
          `${API}/api/risks/incidents/fire/${encodeURIComponent(alert.incidentTimestamp)}?nodeID=${alert.nodeID}`
        );
        
        if (res.ok) {
          const json = await res.json();
          console.log("📊 Fire incident data:", json); // Debug log
          
          const alerts = (json?.alerts || []).map(a => ({
            timestamp: a.updated_at,
            temperature: a.temperature,
            humidity: a.humidity,
            co_level: a.co_level,
            fire_risklvl: a.fire_risklvl,
            confidence: a.confidence,
            readingID: a.readingID,
          }));
          
          console.log("📊 Mapped alerts:", alerts); // Debug log
          setSelectedAlertReadings(alerts);
        } else {
          console.error("Failed to fetch fire incident:", res.status);
        }
      } catch (err) {
        console.error("Error fetching fire incident readings:", err);
      }
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAlert(null);
    setSelectedAlertReadings([]);
  };

  const handleResolve = async () => {
    if (!selectedAlert) return;
    setResolving(true);
    
    try {
      const res = await fetch(`${API}/api/risks/${selectedAlert.id}/resolve`, { 
        method: "PATCH" 
      });
      
      if (!res.ok) {
        console.error("Failed to resolve risk:", await res.text());
        return;
      }

      // Remove from active alerts
      if (selectedAlert.risk_type === "fire") {
        // Remove all fire alerts with same incident timestamp
        setActiveAlerts(prev => 
          prev.filter(a => 
            !(a.nodeID === selectedAlert.nodeID && 
              a.incidentTimestamp === selectedAlert.incidentTimestamp && 
              a.risk_type === "fire")
          )
        );
      } else {
        // Remove single alert
        setActiveAlerts(prev => prev.filter(a => a.id !== selectedAlert.id));
      }
      
      handleClose();
    } catch (err) {
      console.error("Error resolving risk:", err);
    } finally {
      setResolving(false);
    }
  };

  // Track elapsed time
  React.useEffect(() => {
    if (!selectedAlert) return;

    const alertTime = new Date(selectedAlert.timestamp).getTime();

    const timer = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - alertTime) / 1000);

      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;

      let formatted;
      if (hours > 0) {
        formatted = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      } else if (minutes > 0) {
        formatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      } else {
        formatted = String(seconds).padStart(2, "0");
      }

      setElapsed(formatted);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAlert]);

  // Initial fetch - Get ONLY incident starts for fire, all others normally
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/risks/active/all`);
        if (!res.ok) return;
        
        const json = await res.json();
        const allActive = (json?.risks || []);
        
        // ✅ Filter: For fire risks, only keep incident starts
        const filtered = allActive.filter(r => {
          if (r.risk_type === "fire") {
            return r.is_incident_start === 1;
          }
          return true; // Keep all chainsaw/gunshots
        });
        
        const active = filtered.map(mapRisk);
        setActiveAlerts(active);
        console.log(`✅ Loaded ${active.length} active alerts (${filtered.filter(r => r.risk_type === 'fire').length} fire incidents)`);
      } catch (err) {
        console.error("Error fetching active risks:", err);
      }
    })();
  }, [API]);

  // WebSocket updates
  React.useEffect(() => {
    if (!lastMessage) return;

    console.log("📨 ActiveAlerts WebSocket:", lastMessage.event);

    // New risk detected
    if (lastMessage.event === "risk_detected") {
      const risks = lastMessage.data?.risks || [];
      
      risks.forEach(risk => {
        const newAlert = mapRisk({
          riskID: risk.riskID,
          nodeID: lastMessage.data.nodeID,
          timestamp: risk.incidentTimestamp || lastMessage.timestamp,
          updated_at: lastMessage.timestamp,
          risk_type: risk.risk_type,
          fire_risklvl: risk.risk_level,
          confidence: risk.confidence,
          resolved_at: null,
          is_incident_start: risk.isNewIncident ? 1 : 0,
          cooldown_counter: 0,
          temperature: lastMessage.data.temperature,
          humidity: lastMessage.data.humidity,
          co_level: lastMessage.data.co_level,
        });

        setActiveAlerts(prev => {
          // ✅ For fire: Only add if it's a NEW incident start
          if (risk.risk_type === "fire") {
            if (risk.isNewIncident) {
              console.log("🔥 New fire incident added to active alerts");
              return [newAlert, ...prev];
            } else {
              console.log("🔥 Fire alert added to existing incident (not shown in active alerts)");
              return prev; // Don't add subsequent alerts
            }
          }
          
          // ✅ For chainsaw/gunshots: Add normally
          return [newAlert, ...prev];
        });
      });
    }

    // Fire cooldown update - update the incident start card
    if (lastMessage.event === "fire_cooldown_update") {
      const { nodeID, incidentTimestamp, cooldown_counter } = lastMessage.data;
      
      setActiveAlerts(prev =>
        prev.map(a =>
          a.nodeID === nodeID && 
          a.incidentTimestamp === incidentTimestamp && 
          a.risk_type === "fire"
            ? { ...a, cooldown_counter, updated_at: lastMessage.timestamp }
            : a
        )
      );
    }

    // Fire resolved
    if (lastMessage.event === "fire_resolved" || lastMessage.event === "fire_resolved_manual") {
      const { nodeID, incidentTimestamp } = lastMessage.data;
      
      setActiveAlerts(prev =>
        prev.filter(a =>
          !(a.nodeID === nodeID && a.incidentTimestamp === incidentTimestamp && a.risk_type === "fire")
        )
      );
      
      console.log("✅ Fire incident removed from active alerts");
    }

    // Single risk resolved
    if (lastMessage.event === "risk_resolved") {
      const { riskID } = lastMessage.data;
      setActiveAlerts(prev => prev.filter(a => a.id !== riskID));
    }
  }, [lastMessage]);

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        overflowX: "auto",
        py: 1,
        scrollbarWidth: "thin",
        "&::-webkit-scrollbar": { height: 8 },
        "&::-webkit-scrollbar-thumb": {
          background: colors.green[700],
          borderRadius: 4,
        },
      }}
    >
      {activeAlerts.length === 0 ? (
        <Typography color={colors.grey[400]}>No active alerts.</Typography>
      ) : (
        activeAlerts.map((alert) => (
          <Card
            key={`${alert.risk_type}-${alert.nodeID}-${alert.incidentTimestamp}`}
            onClick={() => handleOpen(alert)}
            sx={{
              minWidth: 220,
              backgroundColor:
                alert.type === "Wildfire Risk"
                  ? colors.red[900]
                  : alert.type === "Illegal Logging"
                  ? colors.brown?.[900] ?? colors.grey[800]
                  : alert.type === "Poaching"
                  ? colors.blue[900]
                  : colors.grey[800],
              color: colors.grey[100],
              flex: "0 0 auto",
              boxShadow: "none",
              cursor: "pointer",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                fontWeight={700}
                color={
                  alert.type === "Wildfire Risk"
                    ? colors.red[400]
                    : alert.type === "Illegal Logging"
                    ? colors.brown?.[400] ?? colors.grey[400]
                    : alert.type === "Poaching"
                    ? colors.blue[400]
                    : colors.grey[400]
                }
              >
                {alert.type}
              </Typography>
              <Box display="flex" flexDirection="column" mt={1}>
                <Typography variant="caption" color={colors.grey[400]}>
                  Detected By: {alert.node}
                </Typography>
                <Typography variant="caption" color={colors.grey[400]}>
                  At: {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : ""}
                </Typography>
                {/* Show cooldown for fire incidents */}
                {alert.risk_type === "fire" && alert.cooldown_counter > 0 && (
                  <Typography variant="caption" color={colors.orange[400]} fontWeight={600}>
                    Cooldown: {alert.cooldown_counter}/5
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Alert Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            display: "flex",
            flexDirection: "column",
            width: selectedAlert?.type === "Wildfire Risk" ? 800 : 550,
            height: selectedAlert?.type === "Wildfire Risk" ? 500 : 300,
          }}
        >
          {selectedAlert && (
            <>
              {/* Modal Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={600}
                  color={
                    selectedAlert.type === "Wildfire Risk"
                      ? colors.red[400]
                      : selectedAlert.type === "Illegal Logging"
                      ? colors.brown?.[400] ?? colors.grey[400]
                      : colors.blue[400]
                  }
                >
                  {selectedAlert.type === "Wildfire Risk" ? <WhatshotIcon sx={{fontSize: 20}} /> :
                    selectedAlert.type === "Illegal Logging" ? <ParkIcon sx={{fontSize: 20}} /> :
                    <PetsIcon sx={{fontSize: 20}} />}
                  {" "}{selectedAlert.type}
                </Typography>

                <Chip
                  label={`Time Elapsed: ${elapsed}`}
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    px: 1,
                    backgroundColor:
                      selectedAlert.type === "Wildfire Risk"
                        ? colors.red[400]
                        : selectedAlert.type === "Illegal Logging"
                        ? colors.brown?.[400]
                        : colors.blue[400],
                    color: colors.grey[900],
                  }}
                />
              </Box>

              {/* Modal Body */}
              <Box sx={{ flex: 1, overflowY: "auto" }}>
                <Typography mb={1.2}>
                  <strong>Detected By:</strong> {selectedAlert.node}
                </Typography>
                <Typography mb={1.2}>
                  <strong>Detected At:</strong>{" "}
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>

                {/* Show confidence for audio alerts */}
                {selectedAlert.confidence != null && (
                  <Typography mb={1.2}>
                    <strong>Confidence:</strong> {formatConfidence(selectedAlert.confidence)}
                  </Typography>
                )}

                {/* Show initial readings */}
                {selectedAlert.temperature != null && (
                  <Typography mb={1.2}>
                    <strong>Initial Temperature:</strong> {selectedAlert.temperature.toFixed(1)}°C
                  </Typography>
                )}
                {selectedAlert.humidity != null && (
                  <Typography mb={1.2}>
                    <strong>Initial Humidity:</strong> {selectedAlert.humidity.toFixed(1)}%
                  </Typography>
                )}
                {selectedAlert.co_level != null && (
                  <Typography mb={1.2}>
                    <strong>Initial CO Level:</strong> {selectedAlert.co_level} ppm
                  </Typography>
                )}

                {/* Fire incident readings timeline */}
                {selectedAlert.type === "Wildfire Risk" && selectedAlertReadings.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                      Fire Incident Timeline ({selectedAlertReadings.length} alerts):
                    </Typography>

                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Time</strong></TableCell>
                          <TableCell><strong>Temp (°C)</strong></TableCell>
                          <TableCell><strong>Humidity (%)</strong></TableCell>
                          <TableCell><strong>CO (ppm)</strong></TableCell>
                          <TableCell><strong>Severity</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedAlertReadings.map((reading, idx) => {
                          const severity =
                            reading.fire_risklvl === "high" ? "High" :
                            reading.fire_risklvl === "medium" ? "Moderate" : "Low";

                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                {new Date(reading.timestamp).toLocaleTimeString()}
                              </TableCell>
                              <TableCell>{reading.temperature?.toFixed(1) ?? "—"}</TableCell>
                              <TableCell>{reading.humidity?.toFixed(1) ?? "—"}</TableCell>
                              <TableCell>{reading.co_level ?? "—"}</TableCell>
                              <TableCell
                                sx={{
                                  fontWeight: "bold",
                                  color:
                                    severity === "High" ? "red" :
                                    severity === "Moderate" ? "orange" : "green",
                                }}
                              >
                                {severity}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Box>

              {/* Modal Footer */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 1,
                  mt: 2,
                  pt: 2,
                  borderTop: "1px solid #ccc",
                }}
              >
                <Button onClick={handleClose} variant="outlined">
                  Close
                </Button>

                <Button 
                  variant="contained" 
                  color={selectedAlert.type === "Wildfire Risk" ? "error" : "primary"}
                  onClick={handleResolve} 
                  disabled={resolving}
                >
                  {resolving ? "Resolving…" : "Resolve"}
                </Button>
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ActiveAlerts;
