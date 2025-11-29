import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Badge,
  useMantineColorScheme,
  useMantineTheme,
  Button as MantineButton,
} from '@mantine/core';
import { Header } from './global/Header.jsx';
import { useWebSocket } from "../hooks/useWebSocket";
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
  GridLogicOperator
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
  XIcon, 
  ColumnsIcon, 
  FunnelIcon, 
  DownloadIcon, 
  MagnifyingGlassIcon,
  FileTextIcon,
  SplitVerticalIcon, // For density icon
  CheckIcon, // For selected density
} from "@phosphor-icons/react";

const Readings = () => {
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme(); // ✅ Access Mantine theme
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState('standard'); // ✅ Density state

  // ✅ Access colors from Mantine theme instead of hardcoding
  const colors = {
    frostedMint: mantineTheme.colors['frosted-mint'],
    lightGreen: mantineTheme.colors['light-green'],
    mintLeaf: mantineTheme.colors['mint-leaf'],
    verdigris: mantineTheme.colors.verdigris,
    chocolatePlum: mantineTheme.colors['chocolate-plum'],
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

  // Fetch initial readings
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/api/readings`);

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

  // Handle real-time WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    console.log("📨 WebSocket message:", lastMessage);

    if (lastMessage.event === "new_reading") {
      const newReading = {
        readingID: lastMessage.data?.readingID,
        nodeName: lastMessage.data?.nodeName || `Node ${lastMessage.data?.nodeID}`,
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
        if (prev.some((r) => r.readingID === newReading.readingID)) {
          return prev;
        }
        console.log("📊 New reading received:", newReading);
        return [newReading, ...prev];
      });
    }
  }, [lastMessage]);

  // DataGrid columns
  const columns = [
    { 
      field: "readingID", 
      headerName: "ID", 
      width: 90,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value}
        </Text>
      ),
    },
    {
      field: "timestamp",
      headerName: "Timestamp",
      flex: 1.5,
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
      field: "nodeName",
      headerName: "Detected By",
      flex: 1,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" fw={500} style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value || `Node ${params.row.nodeID}`}
        </Text>
      ),
    },
    { 
      field: "temperature", 
      headerName: "Temp (°C)", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const temp = params.value;
        if (temp === null || temp === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
            {temp.toFixed(1)}°C
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value.toFixed(1)}°C` : "";
      },
    },
    { 
      field: "humidity", 
      headerName: "Humidity (%)", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const humidity = params.value;
        if (humidity === null || humidity === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
            {humidity.toFixed(1)}%
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value.toFixed(1)}%` : "";
      },
    },
    { 
      field: "co_level", 
      headerName: "CO Level (ppm)", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const co = params.value;
        if (co === null || co === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
            {co} ppm
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value} ppm` : "";
      },
    },
    { 
      field: "latitude", 
      headerName: "Latitude", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const lat = params.value;
        if (lat === null || lat === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" family="monospace" style={{ fontFamily: mantineTheme.fontFamily }}>
            {lat.toFixed(6)}
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? value.toFixed(6) : "";
      },
    },
    { 
      field: "longitude", 
      headerName: "Longitude", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const lng = params.value;
        if (lng === null || lng === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" family="monospace" style={{ fontFamily: mantineTheme.fontFamily }}>
            {lng.toFixed(6)}
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? value.toFixed(6) : "";
      },
    },
    { 
      field: "altitude", 
      headerName: "Altitude (m)", 
      flex: 1,
      headerAlign: 'center',
      align: 'center',
      type: 'number',
      renderCell: (params) => {
        const alt = params.value;
        if (alt === null || alt === undefined) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              —
            </Text>
          );
        }
        return (
          <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
            {alt.toFixed(1)}m
          </Text>
        );
      },
      valueFormatter: (value) => {
        return value !== null && value !== undefined ? `${value.toFixed(1)}m` : "";
      },
    },
    {
      field: "fix",
      headerName: "GPS Fix",
      width: 100,
      headerAlign: 'center',
      align: 'center',
      type: 'boolean',
      renderCell: (params) => {
        const hasFix = params.value === true || params.value === 1;
        return (
          <Badge
            variant="light"
            color={hasFix ? "green" : "red"}
            size="sm"
            style={{ fontFamily: mantineTheme.fontFamily }}
          >
            {hasFix ? "Yes" : "No"}
          </Badge>
        );
      },
      valueFormatter: (value) => {
        const hasFix = value === true || value === 1;
        return hasFix ? "Yes" : "No";
      },
    },
  ];

  // PDF Export function
  const handlePdfExport = (orientation = "portrait") => {
    if (!apiRef.current) return;
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

    const getVisibleRowsSafe = () => {
      try {
        if (apiRef.current?.getSortedRowIds) {
          return apiRef.current
            .getSortedRowIds()
            .map((id) => apiRef.current.getRow(id));
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
    doc.text("Environmental Readings Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Readings: ${visibleRows.length}`, 40, 75);

    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = visibleRows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "timestamp") {
          return val ? new Date(val).toLocaleString() : "";
        }
        if (col.field === "fix") {
          return val ? "Yes" : "No";
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
                        <MagnifyingGlassIcon size={18} weight="regular" />
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
        title="Environmental Readings" 
        subtitle={`Monitor real-time and historical sensor data • WebSocket: ${connectionStatus} • Total Readings: ${rows.length}`} 
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
            showToolbar //NEVER REMOVE SINCE THIS SHOWS THE TOOLBAR
            density={density} // ✅ Apply density setting
            slots={{ toolbar: CustomToolbar }}
            slotProps={{
              toolbar: { apiRef, onPdfExport: handlePdfExport },
            }}
            rows={rows}
            columns={columns}
            loading={loading}
            getRowId={(row) => row.readingID || row.id}
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

export default Readings;