import { Box, Button, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
import {Link} from "react-router-dom";

//components
import Header from "../../components/Header";
import LastData from "../../components/LastData";
import LastAlert from "../../components/LastAlert";
import NodesStatus from "../../components/NodesStatus";
import ActiveAlerts from "../../components/ActiveAlerts";
import LatestReadings from "../../components/LatestReadings";

//mock data
import {mockDataReadings} from "../../data/mockData";
import {mockDataAlerts} from "../../data/mockData";

const Dashboard = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  return (
    <Box m="20px">
      {/* header */}
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Header title="Ranger's Dashboard" subtitle="Welcome to your dashboard" />
      </Box>

      <Box className="wrapper">
        
          {/* nodes status */}
          <Box className="r1_c1" backgroundColor={colors.black[400]}>
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[500]}>
              Sensor Nodes Status
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


          {/* last data reading */}
          <Box className="r2_c1" backgroundColor={colors.black[400]}>
            <Typography variant="h5" fontWeight={600} mb={2} color={colors.green[500]}>
              Time Since Last Data Reading
            </Typography>

            <LastData readings={mockDataReadings} color={colors.black[400]} />
          </Box>
        
          {/* latest environmental readings */}
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
                Latest Environmental Readings
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
            
            <LatestReadings />
          </Box>

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