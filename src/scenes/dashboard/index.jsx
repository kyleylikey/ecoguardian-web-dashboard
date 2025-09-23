import { Box, Button, IconButton, Typography, useTheme, Card, CardContent } from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import { DataGrid } from "@mui/x-data-grid";
import {mockDataReadings} from "../../data/mockData";
import {columns} from "../readings";
import {mockDataAlerts} from "../../data/mockData";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

//components
import LastData from "../../components/LastData";
import LastAlert from "../../components/LastAlert";
import NodesStatus from "../../components/NodesStatus";
import ActiveAlerts from "../../components/ActiveAlerts";


//icons
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  // Sort readings by timestamp (descending)
  const sortedReadings = [...mockDataReadings].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const recentReadings = sortedReadings.slice(0, 5);

  return (
    <Box m="20px">
      {/* header */}
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
        gridAutoRows="16px"
        gap="20px"
      >
        {/* row 1 */}
        <Box
          gridColumn="span 4"
          gridRow="span 6"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* nodes status */}
          <Box height="80%" width="100%" display="flex" flexDirection="column" >
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[600]}>
              Nodes Status
            </Typography>
            {/* thin not working */}
            <Box
              flex={1}
              minHeight={0}
              sx={{
                overflowY: "auto",
                scrollbarWidth: "thin", // For Firefox
                '&::-webkit-scrollbar': {
                  width: '6px', // For Chrome, Edge, Safari
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: colors.green[700], // Or any color you want
                  borderRadius: '3px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent',
                },
              }}
            >
              <NodesStatus />
            </Box>
          </Box>
        </Box>

        <Box
          gridColumn="span 8"
          gridRow="span 6"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* active alerts */}
          <Box height="80%" width="100%">
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[600]}>
              Active Alerts
            </Typography>

            <ActiveAlerts />
          </Box>

        </Box>

        {/* row 2 */}
        <Box
          gridColumn="span 4"
          gridRow="span 4"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* last data reading */}
          <Box height="70%" width="100%">
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[600]}>
              Time Since Last Data Reading
            </Typography>

            <LastData readings={mockDataReadings} color={colors.black[400]} />
          </Box>

        </Box>

        <Box
          gridColumn="span 8"
          gridRow="span 9"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* recent environmental readings */}
          <Box height="85%" width="100%">
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[600]}>
              Recent Environmental Readings
            </Typography>

            <TableContainer
              sx={{
                backgroundColor: colors.black[400],
                maxHeight: "100%",
                overflowY: "auto",
                color: colors.grey[100],
                borderRadius: 1,
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>ID</TableCell>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>Timestamp</TableCell>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>Detected By</TableCell>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>Temperature</TableCell>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>Humidity</TableCell>
                    <TableCell sx={{ color: colors.black[600], backgroundColor: colors.black[400] }}>CO Level</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentReadings.map((reading) => (
                    <TableRow key={reading.id} hover>
                      <TableCell sx={{ color: colors.grey[100] }}>{reading.id}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>
                        {new Date(reading.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{reading.node}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{reading.temp}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{reading.humidity}</TableCell>
                      <TableCell sx={{ color: colors.grey[100] }}>{reading.co_lvl}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

          </Box>

        </Box>

        {/* row 3 */}
        <Box
          gridColumn="span 4"
          gridRow="span 4"
          backgroundColor={colors.black[400]}
          display="flex"
          alignItems="center"
          justifyContent="center"
          padding="0 20px"
        >
          {/* days since last threat alert */}
          <Box height="70%" width="100%">
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[600]}>
              Days Since Last Threat Alert
            </Typography>
            <LastAlert alerts={mockDataAlerts} color={colors.black[400]} />
          </Box>

        </Box>

        </Box>
      </Box>

    
  );
}

export default Dashboard;