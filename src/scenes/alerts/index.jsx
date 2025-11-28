import React, { useEffect, useState } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Chip from "@mui/material/Chip";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  DataGrid,
  useGridApiRef,
  Toolbar,
  ToolbarButton,
  ColumnsPanelTrigger,
  FilterPanelTrigger,
  ExportCsv,
  QuickFilter,
  QuickFilterControl,
  QuickFilterClear,
  QuickFilterTrigger,
} from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import Badge from "@mui/material/Badge";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ParkIcon from "@mui/icons-material/Park";
import PetsIcon from "@mui/icons-material/Pets";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import { styled } from "@mui/material/styles";
import { useWebSocket } from "../../hooks/useWebSocket";

const Alerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  // WebSocket connection for real-time updates
  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Format confidence (0..1 -> percent, otherwise show raw)
  const formatConfidence = (c) => {
    if (c === null || c === undefined) return "N/A";
    const n = Number(c);
    if (!isNaN(n)) return n <= 1 ? `${(n * 100).toFixed(1)}%` : String(n);
    return String(c);
  };

  // Map backend risk row -> UI row
  const mapRisk = (r) => {
    const typeMap = {
      fire: "Wildfire Risk",
      chainsaw: "Illegal Logging",
      gunshots: "Poaching",
    };
    const severityMap = {
      high: "High",
      medium: "Medium",
      low: "Low",
    };

    const type = typeMap[r.risk_type] || (r.risk_type ? String(r.risk_type) : "Unknown");
    const severity =
      severityMap[String(r.fire_risklvl || "").toLowerCase()] ||
      (r.fire_risklvl ? String(r.fire_risklvl) : null);
    const isResolved = r.resolved_at !== null && r.resolved_at !== undefined;
    const status = isResolved ? "Resolved" : "Active";

    return {
      id: r.riskID,
      riskID: r.riskID,
      type,
      nodeName: r.nodeName || `Node ${r.nodeID}`,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      severity,
      resolved_at: r.resolved_at,
      confidence: r.confidence ?? null,
      status,
      cooldown_counter: r.cooldown_counter,
      is_incident_start: r.is_incident_start,
      risk_type: r.risk_type,
      // ✅ Add reading data
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      readingID: r.readingID,
    };
  };

  const columns = [
    {
      field: "riskID",
      headerName: "ID",
      width: 80,
    },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: ({ row: { type } }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", height: "100%" }}>
          {type === "Wildfire Risk" && <WhatshotIcon sx={{ fontSize: 16, color: colors.red[400] }} />}
          {type === "Illegal Logging" && <ParkIcon sx={{ fontSize: 16, color: colors.green[400] }} />}
          {type === "Poaching" && <PetsIcon sx={{ fontSize: 16, color: colors.yellow[400] }} />}
          <Typography sx={{ fontSize: 13 }}>{type}</Typography>
        </Box>
      ),
    },
    {
      field: "nodeName",
      headerName: "Detected By",
      flex: 1,
    },
    {
      field: "timestamp",
      headerName: "First Detected",
      flex: 1,
      renderCell: (params) => (
        <span>{params.value ? new Date(params.value).toLocaleString() : ""}</span>
      ),
    },
    {
      field: "updated_at",
      headerName: "Last Update",
      flex: 1,
      renderCell: (params) => (
        <span>{params.value ? new Date(params.value).toLocaleString() : ""}</span>
      ),
    },
    // ✅ Add reading columns
    {
      field: "temperature",
      headerName: "Temp (°C)",
      width: 100,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}</span>
      ),
    },
    {
      field: "humidity",
      headerName: "Humidity (%)",
      width: 120,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}</span>
      ),
    },
    {
      field: "co_level",
      headerName: "CO (ppm)",
      width: 100,
      renderCell: (params) => (
        <span>{params.value !== null && params.value !== undefined ? params.value : "—"}</span>
      ),
    },
    {
      field: "severity",
      headerName: "Severity",
      flex: 1,
      renderCell: ({ row: { severity } }) => {
        const colorMap = {
          High: colors.red[500],
          Medium: colors.orange[500],
          Low: colors.yellow[500],
        };
        return (
          <Chip
            variant="outlined"
            size="small"
            label={severity || "N/A"}
            sx={{
              color: colorMap[severity] || colors.grey[300],
              borderColor: colorMap[severity] || colors.grey[300],
              backgroundColor: "transparent",
            }}
          />
        );
      },
    },
    {
      field: "confidence",
      headerName: "Confidence",
      flex: 1,
      renderCell: ({ row: { confidence } }) => (
        <span>{formatConfidence(confidence)}</span>
      ),
    },
    {
      field: "resolved_at",
      headerName: "Resolved At",
      flex: 1,
      renderCell: (params) => {
        const val = params.value;
        if (!val) return <span>—</span>;
        const d = new Date(val);
        return isNaN(d.getTime()) ? <span>Invalid</span> : <span>{d.toLocaleString()}</span>;
      },
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row: { status } }) =>
        status === "Active" ? (
          <Chip
            variant="outlined"
            color="error"
            size="small"
            icon={<ErrorIcon />}
            label={status}
          />
        ) : status === "Resolved" ? (
          <Chip
            variant="outlined"
            color="success"
            size="small"
            icon={<CheckIcon />}
            label={status}
          />
        ) : (
          <Chip variant="outlined" color="default" size="small" label="N/A" />
        ),
    },
  ];

  // ✅ Fetch initial risks from backend
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/risks`);

        if (!res.ok) {
          console.error("❌ Failed to fetch risks:", res.status, await res.text());
          return;
        }

        const json = await res.json();
        const data = (json?.risks || []).map(mapRisk);
        setRows(data);
        console.log(`✅ Loaded ${data.length} risks`);
      } catch (err) {
        console.error("❌ Error fetching risks:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [API]);

  // ✅ Handle real-time WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    console.log("📨 WebSocket message:", lastMessage);

    // ========================================
    // NEW RISK DETECTED
    // ========================================
    if (lastMessage.event === "risk_detected") {
      const risks = lastMessage.data?.risks || [];

      risks.forEach((risk) => {
        const newRisk = {
          riskID: risk.riskID,
          nodeID: lastMessage.data.nodeID,
          timestamp: risk.incidentTimestamp || lastMessage.timestamp,
          updated_at: lastMessage.timestamp,
          risk_type: risk.risk_type,
          fire_risklvl: risk.risk_level,
          confidence: risk.confidence,
          resolved_at: null,
          is_incident_start: risk.isNewIncident ? 1 : 0,
          cooldown_counter: 0,
          temperature: lastMessage.data.temperature,
          humidity: lastMessage.data.humidity,
          co_level: lastMessage.data.co_level,
          readingID: risk.readingID,
        };

        const mapped = mapRisk(newRisk);

        setRows((prev) => {
          const exists = prev.some((r) => r.riskID === mapped.riskID);

          if (exists) {
            return prev.map((r) =>
              r.riskID === mapped.riskID
                ? {
                    ...r,
                    updated_at: mapped.updated_at,
                    severity: mapped.severity,
                    temperature: mapped.temperature,
                    humidity: mapped.humidity,
                    co_level: mapped.co_level,
                  }
                : r
            );
          } else {
            console.log(`✅ New ${risk.risk_type} risk added:`, mapped);
            return [mapped, ...prev];
          }
        });
      });
    }

    // ========================================
    // FIRE COOLDOWN UPDATE
    // ========================================
    else if (lastMessage.event === "fire_cooldown_update") {
      const { nodeID, incidentTimestamp, cooldown_counter } = lastMessage.data;

      setRows((prev) =>
        prev.map((r) =>
          r.nodeID === nodeID &&
          r.timestamp === incidentTimestamp &&
          r.risk_type === "fire"
            ? { ...r, cooldown_counter, updated_at: lastMessage.timestamp }
            : r
        )
      );

      console.log(`🔥 Fire cooldown update: ${cooldown_counter}/5`);
    }

    // ========================================
    // FIRE RESOLVED (Auto or Manual)
    // ========================================
    else if (lastMessage.event === "fire_resolved" || lastMessage.event === "fire_resolved_manual") {
      const { nodeID, incidentTimestamp } = lastMessage.data;

      setRows((prev) =>
        prev.map((r) =>
          r.nodeID === nodeID &&
          r.timestamp === incidentTimestamp &&
          r.risk_type === "fire"
            ? {
                ...r,
                status: "Resolved",
                resolved_at: lastMessage.timestamp,
                updated_at: lastMessage.timestamp,
              }
            : r
        )
      );

      console.log(`✅ Fire incident resolved for Node ${nodeID}`);
    }

    // ========================================
    // SINGLE RISK RESOLVED (Chainsaw/Gunshots)
    // ========================================
    else if (lastMessage.event === "risk_resolved") {
      const { riskID } = lastMessage.data;

      setRows((prev) =>
        prev.map((r) =>
          r.riskID === riskID
            ? {
                ...r,
                status: "Resolved",
                resolved_at: lastMessage.timestamp,
                updated_at: lastMessage.timestamp,
              }
            : r
        )
      );

      console.log(`✅ Risk ${riskID} resolved`);
    }
  }, [lastMessage]);

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

    doc.setFontSize(18);
    doc.text("Alert Activity Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Rows: ${visibleRows.length}`, 40, 75);

    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = visibleRows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "timestamp" || col.field === "resolved_at" || col.field === "updated_at") {
          return val ? new Date(val).toLocaleString() : "";
        }
        if (col.field === "confidence") {
          return formatConfidence(val);
        }
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

  return (
    <Box m="20px">
      <Header
        title="Alerts"
        subtitle={`View active and all past alerts • WebSocket: ${connectionStatus}`}
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
          rows={rows}
          columns={columns}
          loading={loading}
          slots={{ toolbar: CustomToolbar }}
          slotProps={{
            toolbar: { apiRef, onPdfExport: handlePdfExport },
          }}
          showToolbar
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          getRowId={(row) => row.riskID || row.id}
        />
      </Box>
    </Box>
  );
};

export default Alerts;