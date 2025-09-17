import { useEffect, useState } from "react";

export default function LastData({ readings }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    if (!readings || readings.length === 0) return;

    function updateElapsed() {
      const last = readings[readings.length - 1];
      if (!last) return;

      let lastDate = new Date(last.timestamp);
      if (isNaN(lastDate)) {
        lastDate = new Date(last.timestamp.replace(" ", "T"));
      }

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

    updateElapsed(); // Run once immediately
    const interval = setInterval(updateElapsed, 60000);
    return () => clearInterval(interval);
  }, [readings]);

  if (!readings || readings.length === 0) {
    return <p className="text-muted">No readings yet</p>;
  }

  return (
    <>
      <p className="mb-1 fst-italic">{elapsed}</p>
    </>
  );
}
