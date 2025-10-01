import React from "react";
import {Box, Typography, useTheme} from "@mui/material";
import Chip from '@mui/material/Chip';
import { tokens } from "../../theme";
import { mockDataReadings } from "../../data/mockData";
import Header from "../../components/Header"; 
import {
    DataGrid,
    Toolbar,
    ToolbarButton,
    ColumnsPanelTrigger,
    FilterPanelTrigger,
    ExportCsv,
    ExportPrint,
    QuickFilter,
    QuickFilterControl,
    QuickFilterClear,
    QuickFilterTrigger,
  } from '@mui/x-data-grid';

import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import Badge from '@mui/material/Badge';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CancelIcon from '@mui/icons-material/Cancel';
import SearchIcon from '@mui/icons-material/Search';
import { styled } from "@mui/material/styles";

const Readings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "timestamp", 
            headerName: "Timestamp",
            minWidth: 200,
        },
        {
            field: "node", 
            headerName: "Detected By",
            minWidth: 150,
        },
        {
            field: "temp", 
            headerName: "Temperature (°C)",
            flex: 1
        },
        {
            field: "humidity", 
            headerName: "Humidity (%)",
            flex: 1
        },
        {
            field: "co_lvl", 
            headerName: "CO Level (ppm)",
            flex: 1
        },
    ]

    const StyledQuickFilter = styled(QuickFilter)({
        display: 'grid',
        alignItems: 'center',
      });
      
      const StyledToolbarButton = styled(ToolbarButton)(({ theme, ownerState }) => ({
        gridArea: '1 / 1',
        width: 'min-content',
        height: 'min-content',
        zIndex: 1,
        opacity: ownerState.expanded ? 0 : 1,
        pointerEvents: ownerState.expanded ? 'none' : 'auto',
        transition: theme.transitions.create(['opacity']),
      }));
      
      const StyledTextField = styled(TextField)(({ theme, ownerState }) => ({
        gridArea: '1 / 1',
        overflowX: 'clip',
        width: ownerState.expanded ? 260 : 'var(--trigger-width)',
        opacity: ownerState.expanded ? 1 : 0,
        transition: theme.transitions.create(['width', 'opacity']),
      }));

    function CustomToolbar() {
        const [exportMenuOpen, setExportMenuOpen] = React.useState(false);
        const exportMenuTriggerRef = React.useRef(null);
      
        return (
          <Toolbar>
            <Tooltip title="Columns">
              <ColumnsPanelTrigger render={<ToolbarButton />}>
                <ViewColumnIcon fontSize="small" />
              </ColumnsPanelTrigger>
            </Tooltip>
      
            <Tooltip title="Filters">
              <FilterPanelTrigger
                render={(props, state) => (
                  <ToolbarButton {...props} color="default">
                    <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                      <FilterListIcon fontSize="small" />
                    </Badge>
                  </ToolbarButton>
                )}
              />
            </Tooltip>
      
            <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />
            <Tooltip title="Export">
              <ToolbarButton
                ref={exportMenuTriggerRef}
                id="export-menu-trigger"
                aria-controls="export-menu"
                aria-haspopup="true"
                aria-expanded={exportMenuOpen ? 'true' : undefined}
                onClick={() => setExportMenuOpen(true)}
              >
                <FileDownloadIcon fontSize="small" />
              </ToolbarButton>
            </Tooltip>
      
            <Menu
              id="export-menu"
              anchorEl={exportMenuTriggerRef.current}
              open={exportMenuOpen}
              onClose={() => setExportMenuOpen(false)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{
                list: {
                  'aria-labelledby': 'export-menu-trigger',
                },
              }}
            >
              <ExportPrint render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
                Print
              </ExportPrint>
              <ExportCsv render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
                Download as CSV
              </ExportCsv>
            </Menu>
      
            <StyledQuickFilter>
              <QuickFilterTrigger
                render={(triggerProps, state) => (
                  <Tooltip title="Search" enterDelay={0}>
                    <StyledToolbarButton
                      {...triggerProps}
                      ownerState={{ expanded: state.expanded }}
                      color="default"
                      aria-disabled={state.expanded}
                    >
                      <SearchIcon fontSize="small" />
                    </StyledToolbarButton>
                  </Tooltip>
                )}
              />
              <QuickFilterControl
                render={({ ref, ...controlProps }, state) => (
                  <StyledTextField
                    {...controlProps}
                    ownerState={{ expanded: state.expanded }}
                    inputRef={ref}
                    aria-label="Search"
                    placeholder="Search..."
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                        endAdornment: state.value ? (
                          <InputAdornment position="end">
                            <QuickFilterClear
                              edge="end"
                              size="small"
                              aria-label="Clear search"
                              material={{ sx: { marginRight: -0.75 } }}
                            >
                              <CancelIcon fontSize="small" />
                            </QuickFilterClear>
                          </InputAdornment>
                        ) : null,
                        ...controlProps.slotProps?.input,
                      },
                      ...controlProps.slotProps,
                    }}
                  />
                )}
              />
            </StyledQuickFilter>
          </Toolbar>
        );
      }

    return (
        <Box 
            margin={"20px"}
            >
            <Header 
                title="Environmental Readings" 
                subtitle="View all past and incoming environmental readings"
                ></Header>

            <Box 
                margin={"40px 0 0 0"} 
                height="65vh" 
                
                sx={{
                    "& .MuiDataGrid-root": {
                        border: "none",
                    },
                    "& .MuiDataGrid-columnHeader": {
                        backgroundColor: colors.blue[800],
                        borderBottom: "none",
                    },
                    "& .MuiDataGrid-footerContainer": {
                        backgroundColor: colors.blue[800],
                        borderBottom: "none",
                    },
                }}
            >
                <DataGrid
                    slots={{toolbar: CustomToolbar}}
                    showToolbar
                    rows = {mockDataReadings}
                    columns = {columns}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: {
                        paginationModel: { pageSize: 10, page: 0 },
                        },
                    }}
                />
            </Box>
        </Box>
    )

};

export const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "timestamp", 
            headerName: "Timestamp",
            flex: 1
        },
        {
            field: "node", 
            headerName: "Detected By",
        },
        {
            field: "temp", 
            headerName: "Temperature (°C)",
            flex: 1
        },
        {
            field: "humidity", 
            headerName: "Humidity (%)",
            flex: 1
        },
        {
            field: "co_lvl", 
            headerName: "CO Level (ppm)",
            flex: 1
        },
    ]
export default Readings;