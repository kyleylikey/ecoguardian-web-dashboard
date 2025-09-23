import { Typography } from "@mui/material";
import { mockDataReadings } from "../data/mockData"; // adjust path as needed
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

export default function LastData({ readings }) {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);
  // Sort readings by timestamp (descending)
    const sortedReadings = [...mockDataReadings].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
  
    // Get the most recent reading timestamp
    const lastReading = sortedReadings[0];
    let timeSinceLastReading = "No data";
    if (lastReading) {
      const now = new Date();
      const last = new Date(lastReading.timestamp);
      const diffMs = now - last;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
  
      if (diffDays > 0) {
        timeSinceLastReading = `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      } else if (diffHours > 0) {
        timeSinceLastReading = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      } else if (diffMins > 0) {
        timeSinceLastReading = `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
      } else {
        timeSinceLastReading = "Just now";
      }
    }

  return (
    <>
      <Typography color={colors.grey[100]}>{timeSinceLastReading}</Typography>
    </>
  );
}