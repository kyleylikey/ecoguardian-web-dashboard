import { Typography } from "@mui/material";
import { mockDataAlerts } from "../data/mockData"; // adjust path as needed

const LastAlert = () => {
  if (!mockDataAlerts || mockDataAlerts.length === 0) {
    return <Typography>No alerts found.</Typography>;
  }

  // Find the most recent alert by timestamp
  const sortedAlerts = [...mockDataAlerts].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );
  const lastAlert = sortedAlerts[0];

  const now = new Date();
  const lastAlertDate = new Date(lastAlert.timestamp);
  const diffMs = now - lastAlertDate;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  return (
    <Typography>
      {diffDays === 0
        ? "0 (Last alert occurred today.)"
        : `${diffDays} (Last alert occurred ${diffDays} day${diffDays > 1 ? "s" : ""} ago.)`}
    </Typography>
  );
};

export default LastAlert;