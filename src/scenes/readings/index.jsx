import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { tokens } from "../../theme";
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
} from "@mui/x-data-grid";

import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import Badge from "@mui/material/Badge";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import { styled } from "@mui/material/styles";

const Readings = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [readings, setReadings] = useState([]);

  // ✅ Fetch readings from backend
  useEffect(() => {
    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    let es;

    // initial load (all readings)
    (async () => {
      try {
        const res = await fetch(`${API}/api/readings`);
        const json = await res.json();
        setReadings(json?.data || []);
      } catch (err) {
        console.error("fetch readings failed", err);
      }
    })();

    // SSE updates: prepend new readings, avoid duplicates
    try {
      es = new EventSource(`${API.replace(/\/$/, "")}/sse/readings`);
      es.addEventListener("reading", (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg?.data) {
            setReadings((prev) => {
              // skip if we already have this id
              if (prev.some((r) => r.id === msg.data.id)) return prev;
              return [msg.data, ...prev];
            });
          }
        } catch (err) {
          console.error("invalid SSE message", err);
        }
      });
      es.onerror = (err) => {
        console.error("SSE error", err);
      };
    } catch (err) {
      console.error("SSE init failed", err);
    }

    return () => { if (es) es.close(); };
  }, []);

  // ✅ Define DataGrid columns
  const columns = [
    { field: "id", headerName: "ID", width: 90 },
    { field: "timestamp", headerName: "Timestamp", minWidth: 200 },
    { field: "nodeID", headerName: "Detected By", minWidth: 150 },
    { field: "temperature", headerName: "Temperature (°C)", flex: 1 },
    { field: "humidity", headerName: "Humidity (%)", flex: 1 },
    { field: "co_level", headerName: "CO Level (ppm)", flex: 1 },
  ];

  // ✅ Custom Toolbar Styling
  const StyledQuickFilter = styled(QuickFilter)({
    display: "grid",
    alignItems: "center",
  });

  const StyledToolbarButton = styled(ToolbarButton)(({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    width: "min-content",
    height: "min-content",
    zIndex: 1,
    opacity: ownerState.expanded ? 0 : 1,
    pointerEvents: ownerState.expanded ? "none" : "auto",
    transition: theme.transitions.create(["opacity"]),
  }));

  const StyledTextField = styled(TextField)(({ theme, ownerState }) => ({
    gridArea: "1 / 1",
    overflowX: "clip",
    width: ownerState.expanded ? 260 : "var(--trigger-width)",
    opacity: ownerState.expanded ? 1 : 0,
    transition: theme.transitions.create(["width", "opacity"]),
  }));

  // ✅ Custom Toolbar Component
  function CustomToolbar() {
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
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
            aria-expanded={exportMenuOpen ? "true" : undefined}
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
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            list: {
              "aria-labelledby": "export-menu-trigger",
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

  // ✅ Render
  return (
    <Box m="20px">
      <Header
        title="Environmental Readings"
        subtitle="View all past and incoming environmental readings"
      />

      <Box
        m="40px 0 0 0"
        height="65vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-columnHeader": {
            backgroundColor: colors.blue[800],
            borderBottom: "none",
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: colors.blue[800],
            borderTop: "none",
          },
        }}
      >
        <DataGrid
          rows={readings}
          columns={columns}
          slots={{ toolbar: CustomToolbar }}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default Readings;
