import { useState } from "react";
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Link } from 'react-router-dom';
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";

//icons outlined
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";

import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined';
import ViewListOutlinedIcon from '@mui/icons-material/ViewListOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';

//icons filled
import Dashboard from '@mui/icons-material/Dashboard';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ViewListIcon from '@mui/icons-material/ViewList';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const Item = ({ title, to, icon, filledIcon, selected, setSelected, colors }) => (
  <MenuItem
    active={selected === title}
    onClick={() => setSelected(title)}
    icon={selected === title ? filledIcon : icon}
    component={<Link to={to} />}
  >
    <Typography
      fontSize="14px"
      sx={{
        color: selected === title ? colors.brown[300] : "inherit",
        fontWeight: selected === title ? 600 : 400,
      }}
    >
      {title}
    </Typography>
  </MenuItem>
);

const AppSidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Ranger's Dashboard");

  const menuItemStyles = {
    root: {
      fontSize: '13px',
    },
    container: {
      background: colors.black[400],
    },
    icon: {
      color: colors.black[200],
      backgroundColor: "transparent",
    },
    button: {
      '&:hover': {
        backgroundColor: colors.black[400],
        color: colors.green[700],
      },
    },
  };

  return (
    <Box height="100%">
      <Sidebar collapsed={isCollapsed} style={{ height: "100vh" }} backgroundColor={colors.black[400]}>
        <Menu iconShape="square" menuItemStyles={menuItemStyles}>
          {/* logo and menu */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)} // toggle sidebar

            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined} // show icon only when collapsed

            style={{
              margin: "10px 0 20px 0",
              paddingLeft: isCollapsed ? undefined : "20px", // padding left when not collapsed
              color: colors.grey[100],
            }}
          >
            {!isCollapsed && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <Typography variant="h4" color={colors.brown[300]} fontWeight="600">
                  EcoGuardian
                </Typography>
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          <Box paddingLeft={isCollapsed ? undefined : "0%"}>
            <Item
              title="Ranger's Dashboard"
              to="/"
              icon={<DashboardOutlinedIcon sx={{ fontSize: 22 }} />}
              filledIcon={<Dashboard sx={{ fontSize: 22 }} />}
              selected={selected}
              setSelected={setSelected}
              colors={colors}
            />
            <Item
              title="Alerts"
              to="/alerts"
              icon={<NotificationsActiveOutlinedIcon sx={{ fontSize: 22 }} />}
              filledIcon={<NotificationsActiveIcon sx={{ fontSize: 22 }} />}
              selected={selected}
              setSelected={setSelected}
              colors={colors}
            />
            <Item
              title="Environmental Readings"
              to="/readings"
              icon={<ViewListOutlinedIcon sx={{ fontSize: 22 }} />}
              filledIcon={<ViewListIcon sx={{ fontSize: 22 }} />}
              selected={selected}
              setSelected={setSelected}
              colors={colors}
            />
          </Box>
        </Menu>
      </Sidebar>
    </Box>
  );
};

export default AppSidebar;