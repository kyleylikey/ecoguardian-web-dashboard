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
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import { tokens } from "../theme";

//icons
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ParkIcon from '@mui/icons-material/Park';
import PetsIcon from '@mui/icons-material/Pets';

const ActiveAlerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [open, setOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState(null);
  const [selectedAlertReadings, setSelectedAlertReadings] = React.useState([]);
  const [elapsed, setElapsed] = React.useState("00");
  const [activeAlerts, setActiveAlerts] = React.useState([]);

  const handleOpen = async (alert) => {
    setSelectedAlert(alert);
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    const riskUrl = `${base}/api/riskdetection/${alert.id}`;
    const riskReadingsUrl = `${base}/api/riskdetection/${alert.id}/readings`;

    try {
      // fetch risk info (to get canonical nodeID + timestamp)
      const rRes = await fetch(riskUrl);
      const rJson = rRes.ok ? await rRes.json() : null;
      const riskInfo = rJson?.data ?? null;
      const nodeID = riskInfo?.nodeID ?? alert?._raw?.nodeID ?? alert?.nodeID ?? null;
      const riskTs = riskInfo?.timestamp ?? alert?.timestamp ?? null;

      // fetch risk timeline snapshots
      const tRes = await fetch(riskReadingsUrl);
      const timeline = (tRes.ok ? (await tRes.json())?.data : []) || [];

      // fetch subsequent readings from /api/readings using nodeID + since
      let subsequent = [];
      if (nodeID) {
        const qs = new URLSearchParams({ nodeID: String(nodeID) });
        if (riskTs) qs.set("since", String(riskTs));
        const sRes = await fetch(`${base}/api/readings?${qs.toString()}`);
        subsequent = sRes.ok ? (await sRes.json())?.data ?? [] : [];
      }

      // merge (don't aggressively dedupe) and sort newest-first
      const merged = [...timeline, ...subsequent].slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // normalize and dedupe by sensorReadingID (keep first occurrence), preserve entries without id
      const seenIds = new Set();
      const normalized = [];
      merged.forEach((r, idx) => {
        const sid = r.sensorReadingID ?? r.id ?? null;
        // skip duplicates that have a numeric id (timeline + subsequent may include same reading twice)
        if (sid != null) {
          const n = Number(sid);
          if (seenIds.has(n)) return;
          seenIds.add(n);
        }
        const uniq = sid != null ? `id:${sid}` : `ts:${r.timestamp ?? ''}:${idx}`;
        normalized.push({
          id: sid ?? uniq,
          sensorReadingID: sid ?? null,
          nodeID: r.nodeID ?? r.node ?? null,
          timestamp: r.timestamp,
          temperature: r.temperature ?? null,
          humidity: r.humidity ?? null,
          co_level: r.co_level ?? null,
          latitude: r.latitude ?? r.gps?.latitude ?? null,
          longitude: r.longitude ?? r.gps?.longitude ?? null,
          altitude: r.altitude ?? r.gps?.altitude ?? null,
          fix: !!(r.fix ?? r.gps?.fix),
          _uniqKey: uniq,
        });
      });

      // debug: inspect normalized list
      console.table(normalized.map(x => ({ id: x.id, timestamp: x.timestamp, temp: x.temperature })));

      setSelectedAlertReadings(normalized);
      setOpen(true);
    } catch (err) {
      console.warn("Failed to load readings for alert modal", err);
      setSelectedAlertReadings([]);
    }

    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAlert(null);
    setSelectedAlertReadings([]);
  };

  // Track elapsed time since alert.timestamp
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
        formatted =
          String(hours).padStart(2, "0") +
          ":" +
          String(minutes).padStart(2, "0") +
          ":" +
          String(seconds).padStart(2, "0");
      } else if (minutes > 0) {
        formatted =
          String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
      } else {
        formatted = String(seconds).padStart(2, "0");
      }

      setElapsed(formatted);
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedAlert]);

  // helper to format confidence values (0-1 -> percent)
  const formatConfidence = (c) => {
    if (c === null || c === undefined) return "N/A";
    if (typeof c === "number") return c <= 1 ? `${(c * 100).toFixed(1)}%` : String(c);
    const parsed = parseFloat(String(c));
    if (!isNaN(parsed)) return parsed <= 1 ? `${(parsed * 100).toFixed(1)}%` : String(parsed);
    return String(c);
  };

  // map backend risk -> UI alert object
  const mapRisk = (r) => {
    const typeMap = { fire: "Wildfire Risk", chainsaw: "Illegal Logging", gunshots: "Poaching" };
    const severityMap = { high: "High", medium: "Moderate", low: "Low" };
    const id = r.riskID ?? r.id ?? r.id;
    const nodeLabel = r.nodeName ?? (r.nodeID ? `Node ${r.nodeID}` : "Unknown");
    const type = typeMap[r.risk_type] || (r.risk_type ? String(r.risk_type) : "Unknown");
    const severity = severityMap[String(r.risk_level || "").toLowerCase()] || (r.risk_level ? String(r.risk_level) : "N/A");
    const status = r.resolved ? "Resolved" : "Active";
    return {
      id,
      type,
      node: nodeLabel,
      timestamp: r.timestamp,
      severity,
      resolved_at: r.resolved_at ?? r.res_ack_timestamp ?? null,
      status,
      confidence: r.confidence ?? null, // <-- include confidence
      _raw: r,
    };
  };

  // initial load + SSE for live updates
  React.useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    const listUrl = `${base}/api/riskdetection`;
    const sseUrl = `${base}/sse/risks`;

    let es;

    const fetchActive = async () => {
      try {
        const res = await fetch(listUrl);
        if (!res.ok) return;
        const json = await res.json();
        const active = (json?.data || []).filter(r => !r.resolved).map(mapRisk);
        setActiveAlerts(active);
      } catch (err) {
        console.error("Error fetching risks:", err);
      }
    };

    fetchActive();

    try {
      es = new EventSource(sseUrl);

      es.addEventListener("risk_created", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          if (!payload) return;
          const mapped = mapRisk(payload);
          setActiveAlerts(prev => [mapped, ...prev]);
        } catch (err) {}
      });

      es.addEventListener("risk_updated", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          if (!payload) return;
          const mapped = mapRisk(payload);
          setActiveAlerts(prev => {
            const found = prev.some(a => String(a.id) === String(mapped.id));
            if (found) return prev.map(a => String(a.id) === String(mapped.id) ? { ...a, ...mapped } : a);
            return [mapped, ...prev];
          });

          // if modal open for this id, update selectedAlert + fetch latest readings
          if (selectedAlert && String(selectedAlert.id) === String(mapped.id)) {
            setSelectedAlert(s => s ? { ...s, ...mapped } : s);
            // fetch new readings live
            const readingsUrl = `${base}/api/riskdetection/${mapped.id}/readings`;
            fetch(readingsUrl)
              .then(r => r.ok ? r.json() : null)
              .then(json => {
                if (json?.data) {
                  setSelectedAlertReadings(prevReadings => {
                    const merged = [...prevReadings, ...json.data];
                    const seenIds = new Set();
                    return merged
                      .slice()
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .filter(r => {
                        const sid = r.sensorReadingID ?? r.id ?? null;
                        if (sid != null) {
                          if (seenIds.has(sid)) return false;
                          seenIds.add(sid);
                        }
                        return true;
                      });
                  });
                }
              })
              .catch(err => console.warn("Failed to fetch live readings:", err));
          }
        } catch (err) {
          console.warn("Invalid SSE risk_updated payload", err);
        }
      });

      es.addEventListener("risk_resolved", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          const resolvedId = payload?.riskID ?? payload?.id;
          if (!resolvedId) return;
          setActiveAlerts(prev => prev.filter(a => String(a.id) !== String(resolvedId)));
          if (selectedAlert && String(selectedAlert.id) === String(resolvedId)) {
            setSelectedAlert(s => s ? { ...s, status: "Resolved", resolved_at: payload?.resolved_at ?? new Date().toISOString() } : s);
          }
        } catch (err) {}
      });

      es.onerror = (err) => console.warn("SSE error", err);
    } catch (err) {
      console.warn("Failed to open SSE:", err);
    }

    return () => {
      if (es) es.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAlert]);

  // For UI rendering below, use activeAlerts (live-updated)
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
            key={alert.id}
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
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Alert Modal */}
      <Modal open={open} onClose={handleClose} >
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
                  id="modal-modal-title"
                  variant="h4"
                  fontWeight={600}
                  component="h2"
                  color={
                    selectedAlert.type === "Wildfire Risk"
                      ? colors.red[400]
                      : selectedAlert.type === "Illegal Logging"
                      ? colors.brown?.[400] ?? colors.grey[400]
                      : selectedAlert.type === "Poaching"
                      ? colors.blue[400]
                      : colors.grey[400]
                  }
                >
                  {selectedAlert.type === "Wildfire Risk" ? <WhatshotIcon sx={{fontSize: 20}} /> :
                    selectedAlert.type === "Illegal Logging" ? <ParkIcon sx={{fontSize: 20}} /> :
                    selectedAlert.type === "Poaching" ? <PetsIcon sx={{fontSize: 20}} /> : null}
                  {" "}{selectedAlert.type}
                </Typography>

                <Chip
                  label={`Time Elapsed: ${elapsed}`}
                  sx={{
                    fontSize: "0.9rem",
                    fontWeight: 600,
                    px: 1,
                    backgroundColor:
                      selectedAlert?.type === "Wildfire Risk"
                        ? colors.red[400]
                        : selectedAlert?.type === "Illegal Logging"
                        ? colors.brown?.[400] ?? colors.grey[400]
                        : selectedAlert?.type === "Poaching"
                        ? colors.blue[400]
                        : colors.grey[400],
                    color: colors.grey[900],
                  }}
                />
              </Box>
              {/* Modal Body */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: "auto",
                }}
              >
                <Typography mb={1.2}>
                  <strong>Detected By:</strong> {selectedAlert.node}
                </Typography>
                <Typography mb={1.2}>
                  <strong>Detected At:</strong>{" "}
                  {selectedAlert.timestamp ? new Date(selectedAlert.timestamp).toLocaleString() : ""}
                </Typography>

                {/* Show confidence for audio-based alerts */}
                {selectedAlert?.confidence != null && (
                  <Typography mb={1.2}>
                    <strong>Confidence:</strong> {formatConfidence(selectedAlert.confidence)}
                  </Typography>
                )}

                {/* Wildfire Risk extra readings */}
                {selectedAlert?.type === "Wildfire Risk" && (
                  <Box mt={2}>
                    <Typography variant="h6" gutterBottom>
                      Environmental Readings After Detection:
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
                        {selectedAlertReadings
                          .filter(
                            (r) => !selectedAlert.timestamp || new Date(r.timestamp) >= new Date(selectedAlert.timestamp)
                          )
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // newest first
                          .map((reading, idx) => {
                            // adapt to possible field names returned by DB
                            const temp = reading.temperature ?? reading.temp ?? reading.reading_temperature;
                            const humidity = reading.humidity ?? reading.humidity;
                            const co = reading.co_level ?? reading.co_lvl ?? reading.co_level;
                            const severity =
                              (temp > 35 || co > 20) ? "High" : (temp > 30 || co > 10) ? "Moderate" : "Low";

                            return (
                              <TableRow key={reading._uniqKey ?? reading.id ?? idx}>
                                <TableCell>
                                  {reading.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : ""}
                                </TableCell>
                                <TableCell>{temp ?? "—"}</TableCell>
                                <TableCell>{humidity ?? "—"}</TableCell>
                                <TableCell>{co ?? "—"}</TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    color:
                                      severity === "High"
                                        ? "red"
                                        : severity === "Moderate"
                                        ? "orange"
                                        : "green",
                                  }}
                                >
                                  {severity} Risk
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
                <Button onClick={handleClose} variant="outlined" color={colors.grey[300]}>
                  Close
                </Button>

                {selectedAlert?.type === "Wildfire Risk" ? (
                  <Button variant="contained" color="error">
                    Resolve
                  </Button>
                ) : (
                  <Button variant="contained" color="primary">
                    Acknowledge
                  </Button>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
};

export default ActiveAlerts;
