import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";

const LastAlert = () => {
  const [lastAlertTimestamp, setLastAlertTimestamp] = useState(null);

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    const listUrl = `${base}/api/riskdetection`;
    const sseUrl = `${base}/sse/risks`;

    let es;

    const load = async () => {
      try {
        const res = await fetch(listUrl);
        if (!res.ok) {
          console.warn("Failed to fetch risks:", res.status);
          return;
        }
        const json = await res.json();
        const rows = json?.data ?? [];
        if (rows.length === 0) {
          setLastAlertTimestamp(null);
          return;
        }
        // find newest timestamp
        const newest = rows.reduce((acc, r) => {
          const t = r.timestamp ? new Date(r.timestamp) : null;
          return t && (!acc || t > acc) ? t : acc;
        }, null);
        setLastAlertTimestamp(newest ? newest.toISOString() : null);
      } catch (err) {
        console.warn("Error loading riskdetection:", err);
      }
    };

    load();

    try {
      es = new EventSource(sseUrl);
      es.addEventListener("risk_created", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          const ts = payload?.timestamp ? new Date(payload.timestamp) : new Date();
          setLastAlertTimestamp((prev) => {
            if (!prev) return ts.toISOString();
            return new Date(ts) > new Date(prev) ? ts.toISOString() : prev;
          });
        } catch (err) {
          console.warn("Invalid SSE risk_created payload", err);
        }
      });
      es.onerror = () => {
        // silent - EventSource will retry
      };
    } catch (err) {
      console.warn("Failed to open SSE for risks:", err);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

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
        : `${diffDays}  day${
            diffDays > 1 ? "s" : ""
          } ago.)`}
    </Typography>
  );
};

export default LastAlert;