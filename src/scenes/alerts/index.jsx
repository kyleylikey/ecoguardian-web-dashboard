import React from "react";
import {Box, Typography, useTheme} from "@mui/material";
import Chip from '@mui/material/Chip';
import { tokens } from "../../theme";
import { mockDataAlerts } from "../../data/mockData";
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


//icons
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ParkIcon from '@mui/icons-material/Park';
import PetsIcon from '@mui/icons-material/Pets';
import CheckIcon from '@mui/icons-material/Check';
import ErrorIcon from '@mui/icons-material/Error';

const Alerts = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "type", 
            headerName: "Type", 
            flex: 1,
            renderCell: ({row: {type}}) => {

                return (
                    <Box
                        sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        height: "100%", // optional, helps in some DataGrid configs
                        }}
                    >
                        {type === "Wildfire Risk" && <WhatshotIcon sx={{ fontSize: 16, verticalAlign: "middle" }} />}
                        {type === "Illegal Logging" && <ParkIcon sx={{ fontSize: 16, verticalAlign: "middle" }} />}
                        {type === "Poaching" && <PetsIcon sx={{ fontSize: 16, verticalAlign: "middle" }} />}

                        <Typography
                            sx={{
                                fontSize: 13,
                                lineHeight: 1,
                                verticalAlign: "middle",
                                display: "inline-block",
                            }}
                        >
                        {type}
                        </Typography>
                    </Box>
                    );
            }
        },
        {
            field: "node", 
            headerName: "Detected By", 
            flex: 1,
        },
        {
            field: "timestamp",
            headerName: "Detected At",
            flex: 1,
            renderCell: (params) => (
              <span>{ new Date(params.row.timestamp).toLocaleString() }</span>
            ),
        },          
        {
            field: "severity", 
            headerName: "Severity Reached", 
            flex: 1,
            renderCell: ({row: {severity}}) => {
                return (
                    severity === "High" ? <Chip variant="outlined" size="small" label={severity} 
                    sx={{
                        color: colors.red[500],
                        borderColor: colors.red[500],
                        backgroundColor: "transparent",
                    }}
                    />
                    : severity === "Moderate" ? <Chip variant="outlined" size="small" label={severity}
                    sx={{
                        color: colors.orange[500],
                        borderColor: colors.orange[500],
                        backgroundColor: "transparent",
                    }}
                    />
                    : severity === "Low" ? <Chip variant="outlined" size="small" label={severity}
                    sx={{
                        color: colors.yellow[500],
                        borderColor: colors.yellow[500],
                        backgroundColor: "transparent",
                    }}
                    />
                    : <Chip variant="outlined" color="default" size="small" label="N/A" 
                    
                    />
                );
            }
        },
        {
            field: "res_ack_timestamp", 
            headerName: "Resolved By", 
            flex: 1,
            renderCell: (params) => (
                <span>
                {params.row.res_ack_timestamp
                    ? new Date(params.row.res_ack_timestamp).toLocaleString()
                    : ""}
                </span>

              ),
        },
        {
            field: "status", 
            headerName: "Status", 
            flex: 1,
            renderCell: ({row: {status}}) => {
                return (
                    status === "Active" ? <Chip variant="outlined" color="error" size="small" icon={<ErrorIcon />} label={status} />
                    : status === "Resolved" ? <Chip variant="outlined" color="success" size="small" icon={<CheckIcon />} label={status} />
                    : status === "N/A" ? <Chip variant="outlined" color="default" size="small" label={status} />
                    : <Chip variant="outlined" color="default" size="small" label="N/A" />
                );
            }
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
        <Box margin={"20px"}>
            <Header 
                title="Alerts" 
                subtitle="View active and all past alerts"
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
                    rows = {mockDataAlerts}
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

export default Alerts;