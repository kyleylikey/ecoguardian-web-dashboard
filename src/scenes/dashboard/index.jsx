import { Box, Button, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import NodesBox from "../../components/NodesBox";
import { DataGrid } from "@mui/x-data-grid";
import {mockDataReadings} from "../../data/mockData";
import {columns} from "../readings";

//icons
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  // Filter for recent readings (e.g., last 5)
  const recentReadings = [...mockDataReadings]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  return (
    <Box m="20px">
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Ranger's Dashboard" subtitle="Welcome to your dashboard" />

        <Box>
          <Button
            sx={{
              backgroundColor: colors.blue[700],
              color: colors.grey[100],
              fontSize: "14px",
              fontWeight: "bold",
              padding: "10px 20px",
            }}
          >
            <DownloadOutlinedIcon sx={{ mr: "10px" }} />
            Download Logs
          </Button>
        </Box>
      </Box>

      {/* grids and charts */}
      <Box
        display="grid"
        gridTemplateColumns="repeat(12, 1fr)"
        gridAutoRows="160px"
        gap="20px"
      >
        {/* row 1 */}
        <Box
          gridColumn="span 4"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* nodes status */}
          <Box height="80%" width="100%">
            <Typography variant="h6" mb={2} color={colors.green[600]}>
              Nodes Status
            </Typography>

            <NodesBox />
          </Box>

        </Box>

        <Box
          gridColumn="span 8"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* active alerts */}
          <Box height="80%" width="100%">
            <Typography variant="h6" mb={2} color={colors.green[600]}>
              Active Alerts
            </Typography>

          </Box>

        </Box>

        {/* row 2 */}
        <Box
          gridColumn="span 4"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* last data reading */}
          <Box height="80%" width="100%">
            <Typography variant="h6" mb={2} color={colors.green[600]}>
              Time Since Last Data Reading
            </Typography>

          </Box>

        </Box>

        <Box
          gridColumn="span 8"
          gridRow="span 2"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* recent environmental readings */}
          <Box height="90%" width="100%">
            <Typography variant="h6" mb={2} color={colors.green[600]}>
              Recent Environmental Readings
            </Typography>
            <DataGrid
              rows={recentReadings}
              columns={columns}
              pageSize={5}
              autoHeight
              disableSelectionOnClick
              density="compact" // <-- Add this line
              sx={{
                backgroundColor: colors.black[400],
                color: colors.grey[100],
                border: "none",
              }}
            />
          </Box>

        </Box>

        {/* row 3 */}
        <Box
          gridColumn="span 4"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* days since last threat alert */}
          <Box height="80%" width="100%">
            <Typography variant="h6" mb={2} color={colors.green[600]}>
              Days Since Last Threat Alert
            </Typography>

          </Box>

        </Box>

        </Box>
      </Box>

    
  );
}

export default Dashboard;