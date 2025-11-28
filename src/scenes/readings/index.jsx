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
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
  useGridApiRef,
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useWebSocket } from "../../hooks/useWebSocket";

const Readings = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch initial readings from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/readings`); // ✅ Fixed: was /api/risks

        if (!res.ok) {
          console.error("❌ Failed to fetch readings:", res.status, await res.text());
          return;
        }

        const json = await res.json();
        const data = json?.readings || [];
        setRows(data);
        console.log(`✅ Loaded ${data.length} readings`);
      } catch (err) {
        console.error("❌ Error fetching readings:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  // ✅ Handle real-time WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.event === "new_reading") {
      const newReading = {
        readingID: lastMessage.data?.readingID,
        nodeID: lastMessage.data?.nodeID,
        timestamp: lastMessage.timestamp,
        temperature: lastMessage.data?.temperature,
        humidity: lastMessage.data?.humidity,
        co_level: lastMessage.data?.co_level,
        latitude: lastMessage.data?.location?.latitude,
        longitude: lastMessage.data?.location?.longitude,
        altitude: lastMessage.data?.location?.altitude,
        fix: lastMessage.data?.location?.fix,
      };

      setRows((prev) => {
        // Avoid duplicates
        if (prev.some((r) => r.readingID === newReading.readingID)) {
          return prev;
        }
        // Add new reading to the top
        console.log("📊 New reading received:", newReading);
        return [newReading, ...prev];
      });
    }
  }, [lastMessage]);

  // ✅ Define DataGrid columns
  const columns = [
    { field: "readingID", headerName: "ID", width: 90 },
    {
      field: "timestamp",
      headerName: "Timestamp",
      minWidth: 200,
      valueGetter: (value) => {
        return value ? new Date(value).toLocaleString() : "";
      },
    },
    { field: "nodeID", headerName: "Node ID", minWidth: 100 },
    { 
      field: "temperature", 
      headerName: "Temperature (°C)", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}</span>
      ),
    },
    { 
      field: "humidity", 
      headerName: "Humidity (%)", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}</span>
      ),
    },
    { 
      field: "co_level", 
      headerName: "CO Level (ppm)", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value : "—"}</span>
      ),
    },
    { 
      field: "latitude", 
      headerName: "Latitude", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(6) : "—"}</span>
      ),
    },
    { 
      field: "longitude", 
      headerName: "Longitude", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(6) : "—"}</span>
      ),
    },
    { 
      field: "altitude", 
      headerName: "Altitude (m)", 
      flex: 1,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}</span>
      ),
    },
    {
      field: "fix",
      headerName: "GPS Fix",
      width: 100,
      renderCell: (params) => {
        const hasFix = params.value === true || params.value === 1;
        return (
          <Typography
            sx={{
              display: "inline-block",
            }}
          >
            {hasFix ? "Yes" : "No"}
          </Typography>
        );
      },
    },
  ];

  // ✅ PDF Export Function
  const handlePdfExport = (orientation = "portrait") => {
    if (!apiRef.current) return;
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

    const getVisibleRowsSafe = () => {
      try {
        if (apiRef.current?.getSortedRowIds) {
          return apiRef.current.getSortedRowIds().map((id) => apiRef.current.getRow(id));
        }
        if (apiRef.current?.getVisibleRowModels) {
          return Array.from(apiRef.current.getVisibleRowModels().values());
        }
      } catch (e) {
        console.warn("Failed to read rows from apiRef, falling back to state", e);
      }
      return rows;
    };

    const visibleRows = getVisibleRowsSafe();
    const visibleColumns = apiRef.current?.getVisibleColumns
      ? apiRef.current.getVisibleColumns()
      : columns;

    // Header
    doc.setFontSize(18);
    doc.text("Environmental Readings Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Rows: ${visibleRows.length}`, 40, 75);

    // Build table
    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = visibleRows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "timestamp") return val ? new Date(val).toLocaleString() : "";
        if (col.field === "fix") return val ? "Yes" : "No";
        return val !== undefined && val !== null ? String(val) : "";
      })
    );

    autoTable(doc, {
      startY: 90,
      head: [tableColumn],
      body: tableRows,
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [41, 128, 185], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 40, right: 40 },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 80,
        doc.internal.pageSize.getHeight() - 20
      );
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

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
  function CustomToolbar({ apiRef, onPdfExport }) {
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
        >
          <MenuItem
            onClick={() => {
              onPdfExport("portrait");
              setExportMenuOpen(false);
            }}
          >
            Download as PDF (Portrait)
          </MenuItem>
          <MenuItem
            onClick={() => {
              onPdfExport("landscape");
              setExportMenuOpen(false);
            }}
          >
            Download as PDF (Landscape)
          </MenuItem>
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
                  },
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
        subtitle={`View all past and incoming environmental readings • WebSocket: ${connectionStatus}`}
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
          apiRef={apiRef}
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: { apiRef, onPdfExport: handlePdfExport },
          }}
          showToolbar
          rows={rows}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.readingID || row.id}
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default Readings;