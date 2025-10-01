import { Box, Button, IconButton, Typography, useTheme, Card, CardContent } from "@mui/material";
import { tokens } from "../../theme";
import {mockDataReadings} from "../../data/mockData";
import {mockDataAlerts} from "../../data/mockData";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import {Link} from "react-router-dom";

//components
import Header from "../../components/Header";
import LastData from "../../components/LastData";
import LastAlert from "../../components/LastAlert";
import NodesStatus from "../../components/NodesStatus";
import ActiveAlerts from "../../components/ActiveAlerts";


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
      </Box>

      {/* grids and charts */}
      <Box className="wrapper">
        {/* row 1 */}
        
          {/* nodes status */}
          <Box className="r1_c1" backgroundColor={colors.black[400]}>
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[500]}>
              Nodes Status
            </Typography>
            {/* thin not working */}
            <Box height="80%">
              <NodesStatus />
            </Box>
          </Box>
        

          {/* active alerts */}
          <Box className="r1_c2" backgroundColor={colors.black[400]}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 1,
              }}
            >
              <Typography variant="h5" fontWeight={600} color={colors.green[500]}>
                Active Alerts
              </Typography>

              <Button
                component={Link} to="/alerts"
                size="small"
                sx={{
                  color: colors.grey[700],
                  backgroundColor: colors.black[400],
                  border: `1px solid ${colors.grey[700]}`,  
                  fontWeight: "600",
                  textTransform: "none",
                  "&:hover": {
                    color: colors.grey[500],
                    backgroundColor: colors.black[400],
                    border: `1px solid ${colors.grey[500]}`, 
                  },
                }}
              >
                View All
              </Button>
            </Box>

            <ActiveAlerts />
          </Box>


        {/* row 2 */}
          {/* last data reading */}
          <Box className="r2_c1" backgroundColor={colors.black[400]}>
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[500]}>
              Time Since Last Data Reading
            </Typography>

            <LastData readings={mockDataReadings} color={colors.black[400]} />
          </Box>


        
          {/* recent environmental readings */}
          <Box className="r2_c2" backgroundColor={colors.black[400]}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 1,
              }}
            >
              <Typography variant="h5" fontWeight={600} color={colors.green[500]}>
                Recent Environmental Readings
              </Typography>

              <Button
                component={Link} to="/readings"
                size="small"
                sx={{
                  color: colors.grey[700],
                  backgroundColor: colors.black[400],
                  border: `1px solid ${colors.grey[700]}`,  
                  fontWeight: "600",
                  textTransform: "none",
                  "&:hover": {
                    color: colors.grey[500],
                    backgroundColor: colors.black[400],
                    border: `1px solid ${colors.grey[500]}`, 
                  },
                }}
              >
                View All
              </Button>
            </Box>

            <TableContainer
              sx={{
                backgroundColor: colors.black[400],
                maxHeight: "100%",
                overflowY: "auto",
                color: colors.grey[100],
                borderRadius: 1,
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>ID</TableCell>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Timestamp</TableCell>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Detected By</TableCell>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Temperature (°C)</TableCell>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Humidity (%)</TableCell>
                    <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>CO Level (ppm)</TableCell>
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

        {/* row 3 */}
          {/* days since last threat alert */}
          <Box className="r3_c1" backgroundColor={colors.black[400]}>
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[500]}>
              Days Since Last Threat Alert
            </Typography>
            <LastAlert alerts={mockDataAlerts} color={colors.black[400]} />
          </Box>

      </Box>
    </Box>

    
  );
}

export default Dashboard;