import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { useWebSocket } from "../hooks/useWebSocket";

const LastAlert = () => {
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage } = useWebSocket(WS_URL);
  const [lastAlertTimestamp, setLastAlertTimestamp] = useState(null);

  // Initial fetch
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/risks?limit=1`);
        if (!res.ok) {
          console.warn("Failed to fetch risks:", res.status);
          return;
        }

        const json = await res.json();
        const rows = json?.risks || [];

        if (rows.length > 0 && rows[0].timestamp) {
          setLastAlertTimestamp(rows[0].timestamp);
        }
      } catch (err) {
        console.warn("Error loading risks:", err);
      }
    })();
  }, [API]);

  // WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event === "risk_detected") {
      const ts = lastMessage.timestamp;
      setLastAlertTimestamp((prev) => {
        if (!prev) return ts;
        return new Date(ts) > new Date(prev) ? ts : prev;
      });
    }
  }, [lastMessage]);

  if (!lastAlertTimestamp) {
    return <Typography>No alerts found.</Typography>;
  }

  const now = new Date();
  const last = new Date(lastAlertTimestamp);
  const diffMs = now - last;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return (
    <Typography>
      {diffDays === 0
        ? "0 (Last alert occurred today.)"
        : `${diffDays} day${diffDays > 1 ? "s" : ""} ago.`}
    </Typography>
  );
};

export default LastAlert;