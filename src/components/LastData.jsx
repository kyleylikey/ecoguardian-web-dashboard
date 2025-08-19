import { useEffect, useState } from "react";

export default function LastData({ readings }) {
  const [elapsed, setElapsed] = useState("N/A");

  useEffect(() => {
    if (!readings || readings.length === 0) return;

    // Try to parse timestamp safely
    const lastTimestamp = readings[0].timestamp;
    let lastDate = new Date(lastTimestamp);

    // If it's in "YYYY-MM-DD HH:mm:ss" format, adjust for safe parsing
    if (isNaN(lastDate)) {
      lastDate = new Date(lastTimestamp.replace(" ", "T"));
    }

    function updateElapsed() {
      const now = new Date();
      const diffMs = now - lastDate;

      if (diffMs < 60000) {
        setElapsed("Just now");
      } else if (diffMs < 3600000) {
        const mins = Math.floor(diffMs / 60000);
        setElapsed(`${mins} minute${mins > 1 ? "s" : ""} ago`);
      } else if (diffMs < 86400000) {
        const hrs = Math.floor(diffMs / 3600000);
        setElapsed(`${hrs} hour${hrs > 1 ? "s" : ""} ago`);
      } else {
        const days = Math.floor(diffMs / 86400000);
        setElapsed(`${days} day${days > 1 ? "s" : ""} ago`);
      }
    }

    updateElapsed();
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [readings]);

  return (
    <div>
      <h4 className="subcard_name text-dark">Last Data Received</h4>
      <p>
        <em>{elapsed}</em>
      </p>
    </div>
  );
}
