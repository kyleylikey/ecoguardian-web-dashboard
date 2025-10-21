import React, { useEffect, useRef, useState } from "react";
import { Typography, useTheme } from "@mui/material";
import { tokens } from "../theme";

export default function LastData() {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const [timeSinceLastReading, setTimeSinceLastReading] = useState("Loading...");
  const lastReadingRef = useRef(null);

  const parseTimestamp = (ts) => {
    if (!ts) return null;
    let d = new Date(ts);
    if (!isNaN(d.getTime())) return d;
    const re = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/;
    if (re.test(ts)) {
      d = new Date(ts.replace(" ", "T") + "Z"); // assume UTC if no zone
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  const formatElapsed = (timestamp) => {
    const last = parseTimestamp(timestamp);
    if (!last) return "No data";
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

  useEffect(() => {
    const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ""; // empty => same-origin
    const sseUrl = `${API_BASE.replace(/\/$/, "")}/sse/readings`; // yields "/sse/readings" when API_BASE is ""

    // open SSE first so we don't miss early events
    let es;
    try {
      es = new EventSource(sseUrl);
      es.onopen = () => console.debug("SSE connected", sseUrl);
      es.addEventListener("reading", (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg && msg.data) {
            lastReadingRef.current = msg.data;
            setTimeSinceLastReading(formatElapsed(msg.data.timestamp));
          }
        } catch (err) {
          console.error("Invalid SSE message", err);
        }
      });
      es.onerror = (err) => {
        console.error("SSE error", err);
      };
    } catch (err) {
      console.error("Failed to open SSE", err);
    }

    // initial fetch (populate if SSE missed any or on join)
    (async () => {
      try {
        const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/readings/latest`);
        const json = await res.json();
        const rows = json?.data || [];
        if (rows.length > 0) {
          lastReadingRef.current = rows[0];
          setTimeSinceLastReading(formatElapsed(rows[0].timestamp));
        } else {
          setTimeSinceLastReading("No data");
        }
      } catch (err) {
        console.error("Error fetching latest readings:", err);
        setTimeSinceLastReading("Error fetching data");
      }
    })();

    // tick to update elapsed display as time passes
    const tick = setInterval(() => {
      if (!lastReadingRef.current) return;
      const next = formatElapsed(lastReadingRef.current.timestamp);
      setTimeSinceLastReading((prev) => (prev === next ? prev : next));
    }, 1000);

    return () => {
      if (es) es.close();
      clearInterval(tick);
    };
  }, []);

  return (
    <Typography color={colors.grey[100]} sx={{ fontStyle: "italic" }}>
      {timeSinceLastReading}
    </Typography>
  );
}
