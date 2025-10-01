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
import { mockDataAlerts } from "../data/mockData";
import { mockDataReadings } from "../data/mockData";

//icons
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ParkIcon from '@mui/icons-material/Park';
import PetsIcon from '@mui/icons-material/Pets';

const ActiveAlerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [open, setOpen] = React.useState(false);
  const [selectedAlert, setSelectedAlert] = React.useState(null);
  const [elapsed, setElapsed] = React.useState("00");

  const handleOpen = (alert) => {
    setSelectedAlert(alert);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAlert(null);
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

  // Filter active alerts
  const activeAlerts = mockDataAlerts.filter((alert) => alert.status === "Active");

  // Modal box styles
  const baseModalStyle = {
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
  };

  // For Poaching / Illegal Logging
  const standardModalStyle = {
    ...baseModalStyle,
    width: 550,
    height: 300,
  };

  // For Wildfire Risk (larger)
  const wildfireModalStyle = {
    ...baseModalStyle,
    width: 650,   // adjust as needed
    height: 450,  // taller to fit the readings
  };

  // Decide colors/icons dynamically
  const getAlertVisuals = (type) => {
    if (type === "Wildfire Risk")
      return { color: colors.red[400], icon: <WhatshotIcon sx={{fontSize: 20}} /> };
    if (type === "Illegal Logging")
      return { color: colors.brown[400], icon: <ParkIcon sx={{fontSize: 20}} /> };
    if (type === "Poaching")
      return { color: colors.blue[400], icon: <PetsIcon sx={{fontSize: 20}} /> };
    return { color: colors.grey[400], icon: "⚠️" };
  };

  // Decide wildfire severity based on readings
  const getSeverity = (temperature, humidity, co) => {
    // Default is safe
    let severity = "Safe";

    if (temperature > 35 && humidity < 40 && co > 15) {
      severity = "High";
    } else if (temperature > 30 && humidity < 60 && co > 10) {
      severity = "Moderate";
    } else if (temperature > 28 && humidity < 70 && co > 5) {
      severity = "Low";
    }

    return severity;
  };

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
            //for css styling
            className={
              alert.type === "Wildfire Risk"
                ? "wildfire-card"
                : alert.type === "Illegal Logging"
                ? "logging-card"
                : alert.type === "Poaching"
                ? "poaching-card"
                : ""
            }

            key={alert.id}
            onClick={() => handleOpen(alert)}
            sx={{
              minWidth: 220,
              backgroundColor:
                alert.type === "Wildfire Risk"
                  ? colors.red[900]
                  : alert.type === "Illegal Logging"
                  ? colors.brown[900]
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
                    ? colors.brown[400]
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
                  At: {new Date(alert.timestamp).toLocaleString()}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))
      )}

      {/* Alert Modal */}
      <Modal open={open} onClose={handleClose} >
      <Box
        sx={
          selectedAlert?.type === "Wildfire Risk"
            ? wildfireModalStyle
            : standardModalStyle
        }
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
                  color={getAlertVisuals(selectedAlert.type).color}
                >
                  {getAlertVisuals(selectedAlert.type).icon} {selectedAlert.type}
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
                        ? colors.brown[400]
                        : selectedAlert?.type === "Poaching"
                        ? colors.blue[400]
                        : colors.grey[400],
                    color: colors.grey[900], // ensure readable text
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
                  {new Date(selectedAlert.timestamp).toLocaleString()}
                </Typography>

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
                        {mockDataReadings
                          .filter(
                            (r) => new Date(r.timestamp) >= new Date(selectedAlert.timestamp)
                          )
                          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) // newest first
                          .map((reading, idx) => {
                            const severity =
                              reading.temp > 35 || reading.co_lvl > 20
                                ? "High"
                                : reading.temp > 30 || reading.co_lvl > 10
                                ? "Moderate"
                                : "Low";

                            return (
                              <TableRow key={idx}>
                                <TableCell>
                                  {new Date(reading.timestamp).toLocaleTimeString()}
                                </TableCell>
                                <TableCell>{reading.temp}</TableCell>
                                <TableCell>{reading.humidity}</TableCell>
                                <TableCell>{reading.co_lvl}</TableCell>
                                <TableCell
                                  sx={{
                                    fontWeight: "bold",
                                    color:
                                      severity === "High"
                                        ? "red"
                                        : severity === "Moderate"
                                        ? "orange"
                                        : severity === "Low"
                                        ? "green"
                                        : "grey",
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
