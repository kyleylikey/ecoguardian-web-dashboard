import React, { useEffect, useRef, useState } from "react";
import { Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useWebSocket } from "../hooks/useWebSocket";

export default function LastData() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage } = useWebSocket(WS_URL);

  const [timeSinceLastReading, setTimeSinceLastReading] = useState("Loading...");
  const lastReadingRef = useRef(null);

  const formatElapsed = (timestamp) => {
    if (!timestamp) return "No data";

    const last = new Date(timestamp);
    if (isNaN(last.getTime())) return "Invalid date";

    const now = new Date();
    const diffMs = now - last;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  // Initial fetch
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/readings?limit=1`);
        if (!res.ok) {
          setTimeSinceLastReading("Error fetching data");
          return;
        }

        const json = await res.json();
        const rows = json?.readings || [];

        if (rows.length > 0) {
          lastReadingRef.current = rows[0];
          setTimeSinceLastReading(formatElapsed(rows[0].timestamp));
        } else {
          setTimeSinceLastReading("No data");
        }
      } catch (err) {
        console.error("Error fetching latest reading:", err);
        setTimeSinceLastReading("Error fetching data");
      }
    })();
  }, [API]);

  // WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event === "new_reading") {
      lastReadingRef.current = {
        timestamp: lastMessage.timestamp,
        ...lastMessage.data,
      };
      setTimeSinceLastReading(formatElapsed(lastMessage.timestamp));
    }
  }, [lastMessage]);

  // Tick to update elapsed time
  useEffect(() => {
    const tick = setInterval(() => {
      if (!lastReadingRef.current) return;
      setTimeSinceLastReading(formatElapsed(lastReadingRef.current.timestamp));
    }, 1000);

    return () => clearInterval(tick);
  }, []);

  return (
    <Typography color={colors.grey[100]} sx={{ fontStyle: "italic" }}>
      {timeSinceLastReading}
    </Typography>
  );
}
