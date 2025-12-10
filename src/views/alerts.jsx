import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Badge,
  useMantineColorScheme,
  useMantineTheme,
  Group,
} from '@mantine/core';
import { Header } from './global/Header.jsx';
import { useWebSocket } from "../hooks/useWebSocket.js";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// MUI X DataGrid imports
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
  GridLogicOperator,
} from "@mui/x-data-grid";

import { ThemeProvider, createTheme } from '@mui/material/styles';

// MUI Material components for toolbar
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

// Phosphor Icons
import { 
  FireIcon, 
  TreeIcon, 
  PawPrintIcon, 
  CheckIcon, 
  XIcon, 
  ColumnsIcon, 
  FunnelIcon, 
  DownloadIcon, 
  MagnifyingGlassIcon,
  FileTextIcon,
  SplitVerticalIcon, // For density icon
} from "@phosphor-icons/react";

const Alerts = () => {
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme(); // ✅ Access Mantine theme
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState('standard'); // ✅ Density state

  // ✅ Access colors from Mantine theme
  const colors = {
    frostedMint: mantineTheme.colors['frosted-mint'],
    verdigris: mantineTheme.colors.verdigris,
    mintLeaf: mantineTheme.colors['mint-leaf'],
    chocolatePlum: mantineTheme.colors['chocolate-plum'],
    alertRed: mantineTheme.colors['alert-red'],
    alertOrange: mantineTheme.colors['alert-orange'],
    alertYellow: mantineTheme.colors['alert-yellow'],
  };

  // MUI Theme that matches Mantine color scheme
  const muiTheme = createTheme({
    palette: {
      mode: colorScheme === 'dark' ? 'dark' : 'light',
      primary: {
        main: colors.mintLeaf[5],
      },
      background: {
        default: colorScheme === 'dark' ? '#1a1b1e' : '#ffffff',
        paper: colorScheme === 'dark' ? '#25262b' : '#f5f5f5',
      },
    },
    typography: {
      fontFamily: mantineTheme.fontFamily || 'Parkinsans, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
    },
    components: {
      MuiDataGrid: {
        styleOverrides: {
          root: {
            border: 'none',
            fontFamily: mantineTheme.fontFamily,
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              fontFamily: mantineTheme.fontFamily,
              fontSize: '14px',
            },
            '& .MuiDataGrid-columnHeader': {
              backgroundColor: colorScheme === 'dark' ? colors.verdigris[5] : colors.verdigris[1],
              color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
              borderBottom: 'none',
              display: 'flex',
              alignItems: 'center',
              fontFamily: mantineTheme.fontFamily,
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontFamily: mantineTheme.fontFamily,
              fontWeight: 600,
            },
            '& .MuiDataGrid-footerContainer': {
              backgroundColor: colorScheme === 'dark' ? colors.verdigris[5] : colors.verdigris[1],
              color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
              borderTop: 'none',
              fontFamily: mantineTheme.fontFamily,
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                backgroundColor: colorScheme === 'dark' ? 'rgba(47, 156, 149, 0.08)' : 'rgba(199, 234, 231, 0.3)',
              },
            },
            '& .MuiDataGrid-toolbarContainer': {
              backgroundColor: colorScheme === 'dark' ? colors.verdigris[5] : colors.verdigris[1],
              color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
              borderBottom: '1px solid',
              borderColor: colorScheme === 'dark' ? colors.verdigris[5] : colors.verdigris[1],
              padding: '8px 16px',
              fontFamily: mantineTheme.fontFamily,
              '& .MuiButton-root': {
                fontFamily: mantineTheme.fontFamily,
                color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
                '&:hover': {
                  backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.04)',
                },
              },
              '& .MuiInputBase-root': {
                fontFamily: mantineTheme.fontFamily,
                backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(19,97,70,0.1)',
                '& input': {
                  fontFamily: mantineTheme.fontFamily,
                  color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
                  '&::placeholder': {
                    color: colorScheme === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(16,68,65,0.7)',
                    opacity: 1,
                  },
                },
              },
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: colorScheme === 'dark' ? '#25262b' : '#ffffff',
            border: `1px solid ${colorScheme === 'dark' ? colors.verdigris[6] : colors.verdigris[2]}`,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontFamily: mantineTheme.fontFamily,
            color: colorScheme === 'dark' ? '#ffffff' : colors.verdigris[9],
            '&:hover': {
              backgroundColor: colorScheme === 'dark' ? colors.verdigris[8] : colors.verdigris[1],
            },
          },
        },
      },
    },
  });

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
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      readingID: r.readingID,
    };
  };

    // DataGrid columns with valueFormatter for search
  const columns = [
    {
      field: "riskID",
      headerName: "ID", 
      width: 70,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value}
        </Text>
      ),
    },
    {
      field: "type",
      headerName: "Type",
      width: 180,
      minWidth: 160,
      headerAlign: 'left',
      align: 'left',
      renderCell: ({ row: { type, risk_type } }) => {
        const iconProps = { size: 16, weight: "duotone", style: { flexShrink: 0 } };
        const getIcon = () => {
          switch (risk_type) {
            case "fire": 
              return <FireIcon {...iconProps} color={colors.alertRed[6]} />;
            case "chainsaw": 
              return <TreeIcon {...iconProps} color={colors.chocolatePlum[6]} />;
            case "gunshots": 
              return <PawPrintIcon {...iconProps} color={colors.frostedMint[7]} />;
            default: 
              return <XIcon {...iconProps} color="#868e96" />;
          }
        };

        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden' }}>
            {getIcon()}
            <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {type}
            </Text>
          </div>
        );
      },
      valueFormatter: (value) => value,
    },
    {
      field: "nodeName",
      headerName: "Detected By",
      width: 130,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value}
        </Text>
      ),
    },
    {
      field: "timestamp",
      headerName: "First Detected",
      width: 180,
      minWidth: 160,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value ? new Date(params.value).toLocaleString() : ""}
        </Text>
      ),
      valueFormatter: (value) => {
        return value ? new Date(value).toLocaleString() : "";
      },
    },
    {
      field: "temperature",
      headerName: "Temp (°C)",
      width: 120,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}
        </Text>
      ),
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value.toFixed(1)}°C` : "";
      },
    },
    {
      field: "humidity", 
      headerName: "Humidity (%)",
      width: 120,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value !== null && params.value !== undefined ? params.value.toFixed(1) : "—"}
        </Text>
      ),
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value.toFixed(1)}%` : "";
      },
    },
    {
      field: "co_level",
      headerName: "CO (ppm)",
      width: 120,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value !== null && params.value !== undefined ? params.value : "—"}
        </Text>
      ),
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value} ppm` : "";
      },
    },
    {
      field: "severity",
      headerName: "Severity",
      width: 95,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row: { severity } }) => {
        const colorMap = {
          High: "red",
          Medium: "orange", 
          Low: "yellow",
        };
        
        if (!severity) return (
          <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>N/A</Text>
        );
        
        return (
          <Badge
            variant="light"
            color={colorMap[severity] || "gray"}
            size="sm"
            style={{ fontFamily: mantineTheme.fontFamily }}
          >
            {severity}
          </Badge>
        );
      },
      valueFormatter: (value) => value || "",
    },
    {
      field: "confidence",
      headerName: "Confidence",
      width: 110,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row: { confidence } }) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {formatConfidence(confidence)}
        </Text>
      ),
      valueFormatter: (value) => formatConfidence(value),
    },
    {
      field: "resolved_at",
      headerName: "Resolved At", 
      width: 150,
      minWidth: 160,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => {
        const val = params.value;
        if (!val) return (
          <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>—</Text>
        );
        const d = new Date(val);
        return isNaN(d.getTime()) ? (
          <Text size="sm" c="red" style={{ fontFamily: mantineTheme.fontFamily }}>Invalid</Text>
        ) : (
          <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
            {d.toLocaleString()}
          </Text>
        );
      },
      valueFormatter: (value) => {
        if (!value) return "";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "" : d.toLocaleString();
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 120,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row: { status } }) => {
        if (status === "Active") {
          return (
            <Badge
              variant="light"
              color="red"
              size="sm" 
              leftSection={<XIcon size={12} weight="bold" />}
              style={{ fontFamily: mantineTheme.fontFamily }}
            >
              Active
            </Badge>
          );
        } else if (status === "Resolved") {
          return (
            <Badge
              variant="light"
              color="green"
              size="sm"
              leftSection={<CheckIcon size={12} weight="bold" />}
              style={{ fontFamily: mantineTheme.fontFamily }}
            >
              Resolved
            </Badge>
          );
        }
        return (
          <Badge 
            variant="light" 
            color="gray" 
            size="sm"
            style={{ fontFamily: mantineTheme.fontFamily }}
          >
            N/A
          </Badge>
        );
      },
      valueFormatter: (value) => value || "",
    },
  ];

  // Fetch initial risks from backend
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

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    console.log("📨 WebSocket message:", lastMessage);

    // New risk detected
    if (lastMessage.event === "risk_detected") {
      const risks = lastMessage.data?.risks || [];

      risks.forEach((risk) => {
        const newRisk = {
          riskID: risk.riskID,
          nodeID: lastMessage.data.nodeID,
          nodeName: lastMessage.data.nodeName,
          timestamp: risk.incidentTimestamp || lastMessage.timestamp,
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

    // Cooldown update for any risk type
    else if (lastMessage.event === "fire_cooldown_update" || 
             lastMessage.event === "chainsaw_cooldown_update" || 
             lastMessage.event === "gunshots_cooldown_update") {
      const { nodeID, incidentTimestamp, cooldown_counter, risk_type } = lastMessage.data;

      setRows((prev) =>
        prev.map((r) =>
          r.nodeID === nodeID &&
          r.timestamp === incidentTimestamp &&
          r.risk_type === risk_type
            ? { ...r, cooldown_counter, updated_at: lastMessage.timestamp }
            : r
        )
      );

      const emoji = risk_type === 'fire' ? '🔥' : risk_type === 'chainsaw' ? '🪚' : '🔫';
      console.log(`${emoji} ${risk_type} cooldown update: ${cooldown_counter}/5`);
    }

    // Incident resolved for any risk type
    else if (lastMessage.event === "fire_resolved" || 
             lastMessage.event === "fire_resolved_manual" ||
             lastMessage.event === "chainsaw_resolved" ||
             lastMessage.event === "chainsaw_resolved_manual" ||
             lastMessage.event === "gunshots_resolved" ||
             lastMessage.event === "gunshots_resolved_manual") {
      const { nodeID, incidentTimestamp, risk_type } = lastMessage.data;

      setRows((prev) =>
        prev.map((r) =>
          r.nodeID === nodeID &&
          r.timestamp === incidentTimestamp &&
          r.risk_type === risk_type
            ? {
                ...r,
                status: "Resolved",
                resolved_at: lastMessage.timestamp,
                updated_at: lastMessage.timestamp,
              }
            : r
        )
      );

      const emoji = risk_type === 'fire' ? '🔥' : risk_type === 'chainsaw' ? '🪚' : '🔫';
      console.log(`✅ ${risk_type} incident resolved for Node ${nodeID}`);
    }

    // Single risk resolved (legacy/fallback)
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

  // PDF Export function
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
        console.warn("Failed to read rows from apiRef", e);
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
    doc.text(`Total Alerts: ${visibleRows.length}`, 40, 75);

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
      headStyles: { fillColor: [47, 156, 149], textColor: 255 },
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

  // ✅ Custom Toolbar Component with Density Button
  function CustomToolbar({ apiRef, onPdfExport }) {
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [densityMenuOpen, setDensityMenuOpen] = useState(false); // ✅ Density menu state
    const exportMenuTriggerRef = React.useRef(null);
    const densityMenuTriggerRef = React.useRef(null); // ✅ Density menu ref

    // ✅ Handle density change
    const handleDensityChange = (newDensity) => {
      setDensity(newDensity);
      setDensityMenuOpen(false);
    };

    return (
      <Toolbar>
        {/* Columns Button */}
        <ColumnsPanelTrigger
          render={
            <ToolbarButton
              render={
                <Button startIcon={<ColumnsIcon size={18} weight="duotone" />}>
                  Columns
                </Button>
              }
            />
          }
        />

        {/* ✅ Density Button */}
        <ToolbarButton
          ref={densityMenuTriggerRef}
          onClick={() => setDensityMenuOpen(true)}
          render={
            <Button startIcon={<SplitVerticalIcon size={18} weight="duotone" />}>
              Density
            </Button>
          }
        />

        <Menu
          anchorEl={densityMenuTriggerRef.current}
          open={densityMenuOpen}
          onClose={() => setDensityMenuOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={() => handleDensityChange('compact')}>
            <ListItemIcon>
              {density === 'compact' && <CheckIcon size={16} weight="bold" />}
            </ListItemIcon>
            <ListItemText>Compact</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDensityChange('standard')}>
            <ListItemIcon>
              {density === 'standard' && <CheckIcon size={16} weight="bold" />}
            </ListItemIcon>
            <ListItemText>Standard</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleDensityChange('comfortable')}>
            <ListItemIcon>
              {density === 'comfortable' && <CheckIcon size={16} weight="bold" />}
            </ListItemIcon>
            <ListItemText>Comfortable</ListItemText>
          </MenuItem>
        </Menu>

        {/* Filter Button */}
        <FilterPanelTrigger
          render={
            <ToolbarButton
              render={
                <Button startIcon={<FunnelIcon size={18} weight="duotone" />}>
                  Filters
                </Button>
              }
            />
          }
        />

        {/* Export Button */}
        <ToolbarButton
          ref={exportMenuTriggerRef}
          onClick={() => setExportMenuOpen(true)}
          render={
            <Button startIcon={<DownloadIcon size={18} weight="duotone" />}>
              Export
            </Button>
          }
        />

        <Menu
          anchorEl={exportMenuTriggerRef.current}
          open={exportMenuOpen}
          onClose={() => setExportMenuOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <MenuItem onClick={() => { onPdfExport("portrait"); setExportMenuOpen(false); }}>
            <FileTextIcon size={16} weight="duotone" style={{ marginRight: 8 }} />
            PDF (Portrait)
          </MenuItem>
          <MenuItem onClick={() => { onPdfExport("landscape"); setExportMenuOpen(false); }}>
            <FileTextIcon size={16} weight="duotone" style={{ marginRight: 8 }} />
            PDF (Landscape)
          </MenuItem>
          <ExportCsv 
            render={<MenuItem />} 
            onClick={() => setExportMenuOpen(false)}
          >
            CSV Export
          </ExportCsv>
        </Menu>

        {/* ✅ Search Quick Filter */}
        <QuickFilter
          render={(props, state) => (
            <div {...props} style={{ marginLeft: 'auto', display: 'flex', overflow: 'clip' }}>
              <QuickFilterTrigger
                render={
                  <ToolbarButton
                    render={
                      <Button 
                        aria-label="Search"
                        sx={{
                          minWidth: state.expanded ? 'auto' : '40px',
                          borderRadius: state.expanded ? '4px 0 0 4px' : '4px',
                        }}
                      >
                        <MagnifyingGlassIcon size={18} weight="duotone" />
                      </Button>
                    }
                  />
                }
              />
              <div
                style={{
                  display: 'flex',
                  overflow: 'clip',
                  transition: 'all 300ms ease-in-out',
                  width: state.expanded ? '200px' : '0px',
                }}
              >
                <QuickFilterControl
                  aria-label="Search"
                  placeholder="Search..."
                  render={({ ref, ...controlProps }) => (
                    <TextField
                      {...controlProps}
                      inputRef={ref}
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: state.expanded && state.value !== '' ? '0' : '0 4px 4px 0',
                        },
                      }}
                    />
                  )}
                />
                {state.expanded && state.value !== '' && (
                  <QuickFilterClear
                    render={
                      <Button 
                        aria-label="Clear"
                        sx={{
                          minWidth: '40px',
                          borderRadius: '0 4px 4px 0',
                          padding: '6px',
                        }}
                      >
                        <XIcon size={18} weight="bold" />
                      </Button>
                    }
                  />
                )}
              </div>
            </div>
          )}
        />
      </Toolbar>
    );
  }

  return (
    <Box p="md">
      <Header 
        title="Alert Management" 
        subtitle={`Monitor and track all system alerts • WebSocket: ${connectionStatus} • Total Alerts: ${rows.length}`} 
      />
      
      <Box 
        mt="xl" 
        style={{ 
          height: 'calc(100vh - 200px)',
          minHeight: '500px'
        }}
      >
        <ThemeProvider theme={muiTheme}>
          <DataGrid
            apiRef={apiRef}
            showToolbar // ✅ NEVER REMOVE SINCE THIS SHOWS THE TOOLBAR
            density={density} // ✅ Apply density setting
            slots={{ toolbar: CustomToolbar }}
            slotProps={{
              toolbar: { apiRef, onPdfExport: handlePdfExport },
            }}
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.riskID || row.id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25, page: 0 } },
              sorting: { sortModel: [{ field: 'timestamp', sort: 'desc' }] },
              filter: {
                filterModel: {
                  items: [],
                  quickFilterLogicOperator: GridLogicOperator.Or,
                },
              },
            }}
            disableRowSelectionOnClick
          />
        </ThemeProvider>
      </Box>
    </Box>
  );
};

export default Alerts;