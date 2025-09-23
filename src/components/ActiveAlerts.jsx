import React from "react";
import { Box, Card, CardContent, Typography, useTheme } from "@mui/material"; 
import { tokens } from "../theme";
import { mockDataAlerts } from "../data/mockData";


const ActiveAlerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Filter active alerts
  const activeAlerts = mockDataAlerts.filter(alert => alert.status === "Active");

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
                overflowX: "auto",
                py: 1,
                scrollbarWidth: "thin",
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-thumb": {
                  background: colors.green[700],
                  borderRadius: 4,
                },
              }}
            >
              {activeAlerts.length === 0 ? (
                <Typography color={colors.grey[400]}>No active alerts.</Typography>
              ) : (
                activeAlerts.map(alert => (
                  <Card
                    className={
                      alert.type === "Wildfire Risk"
                        ? "wildfire-card"
                        : alert.type === "Illegal Logging"
                        ? "logging-card"
                        : alert.type === "Poaching"
                        ? "poaching-card"
                        : "poaching-card"
                    }
                    key={alert.id}
                    sx={{
                      minWidth: 220,
                      backgroundColor: 
                      alert.type === "Wildfire Risk" ? colors.red[900] :
                      alert.type === "Illegal Logging" ? colors.brown[900] :
                      alert.type === "Poaching" ? colors.blue[900] :
                      colors.grey[800]
                      ,
                      color: colors.grey[100],
                      flex: "0 0 auto",
                      boxShadow: "none",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" 
                      color={alert.type === "Wildfire Risk" ? colors.red[400] :
                      alert.type === "Illegal Logging" ? colors.brown[400] :
                      alert.type === "Poaching" ? colors.blue[400] :
                      colors.grey[400]} fontWeight={700}>
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
            </Box>
    );
}

export default ActiveAlerts;