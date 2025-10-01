import { Typography } from "@mui/material";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import { useEffect, useState } from "react";
import { mockDataReadings } from "../data/mockData";

export default function LastData({ readings }) {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // local state for time since last reading
  const [timeSinceLastReading, setTimeSinceLastReading] = useState("No data");

  useEffect(() => {
    const updateTime = () => {
      // Sort readings by timestamp (descending)
      const sortedReadings = [...mockDataReadings].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );

      const lastReading = sortedReadings[0];
      if (lastReading) {
        const now = new Date();
        const last = new Date(lastReading.timestamp);
        const diffMs = now - last;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) {
          setTimeSinceLastReading(
            `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
          );
        } else if (diffHours > 0) {
          setTimeSinceLastReading(
            `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
          );
        } else if (diffMins > 0) {
          setTimeSinceLastReading(
            `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
          );
        } else {
          setTimeSinceLastReading("Just now");
        }
      } else {
        setTimeSinceLastReading("No data");
      }
    };

    updateTime(); // run immediately
    const interval = setInterval(updateTime, 60000); // update every 1 min

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <Typography color={colors.grey[100]}>
      {timeSinceLastReading}
    </Typography>
  );
}
