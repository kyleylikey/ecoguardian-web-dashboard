import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Button as MantineButton,
  Modal,
  TextInput,
  Textarea,
  Select,
  Group,
  Stack,
  ActionIcon,
  Tooltip,
  Badge,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Header } from './global/Header.jsx';
import { useWebSocket } from "../hooks/useWebSocket";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// MUI DataGrid
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

// ✅ Phosphor Icons
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ColumnsIcon,
  FunnelIcon,
  DownloadIcon,
  MagnifyingGlassIcon,
  FileTextIcon,
  SplitVerticalIcon,
  CheckIcon,
  XIcon,
} from '@phosphor-icons/react';

const SensorNodes = () => {
  const { colorScheme } = useMantineColorScheme();
  const mantineTheme = useMantineTheme();
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [density, setDensity] = useState('standard');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // ✅ Track signal data per node
  const [nodeSignals, setNodeSignals] = useState({});

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "inactive",
  });

  // ✅ Access colors from Mantine theme
  const colors = {
    frostedMint: mantineTheme.colors['frosted-mint'],
    verdigris: mantineTheme.colors.verdigris,
    mintLeaf: mantineTheme.colors['mint-leaf'],
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

  // Fetch nodes
  useEffect(() => {
    fetchNodes();
  }, [API]);

  const fetchNodes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/sensornodes`);

      if (!res.ok) {
        console.error("❌ Failed to fetch nodes:", res.status);
        return;
      }

      const json = await res.json();
      const nodes = json?.nodes || [];
      setRows(nodes);
      console.log(`✅ Loaded ${nodes.length} sensor nodes`);
    } catch (err) {
      console.error("❌ Error fetching nodes:", err);
    } finally {
      setLoading(false);
    }
  };

  // WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    const nodeID = lastMessage.data?.nodeID;
    const rssi = lastMessage.data?.rssi;
    const snr = lastMessage.data?.snr;

    // Update last_seen when new reading comes in
    if (lastMessage.event === "new_reading") {
      const timestamp = lastMessage.timestamp;

      if (nodeID) {
        // Update signal data
        if (rssi !== undefined && snr !== undefined) {
          setNodeSignals((prev) => ({
            ...prev,
            [nodeID]: { rssi, snr, timestamp },
          }));
        }

        setRows((prev) =>
          prev.map((node) =>
            node.nodeID === nodeID
              ? { ...node, last_seen: timestamp, status: "active" }
              : node
          )
        );
      }
    }

    // Update on risk detected
    if (lastMessage.event === "risk_detected") {
      const timestamp = lastMessage.timestamp;

      if (nodeID) {
        if (rssi !== undefined && snr !== undefined) {
          setNodeSignals((prev) => ({
            ...prev,
            [nodeID]: { rssi, snr, timestamp },
          }));
        }

        setRows((prev) =>
          prev.map((node) =>
            node.nodeID === nodeID
              ? { ...node, last_seen: timestamp, status: "active" }
              : node
          )
        );
      }
    }

    // Handle node status changes
    if (lastMessage.event === "node_status_changed") {
      const { nodeID, status } = lastMessage.data;
      setRows((prev) =>
        prev.map((node) =>
          node.nodeID === nodeID ? { ...node, status } : node
        )
      );
    }
  }, [lastMessage]);

  // ✅ Modal handlers
  const handleOpenModal = (node = null) => {
    if (node) {
      setEditMode(true);
      setSelectedNode(node);
      setFormData({
        name: node.name || "",
        description: node.description || "",
        status: node.status || "inactive",
      });
    } else {
      setEditMode(false);
      setSelectedNode(null);
      setFormData({ name: "", description: "", status: "inactive" });
    }
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditMode(false);
    setSelectedNode(null);
    setFormData({ name: "", description: "", status: "inactive" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Node name is required!");
      return;
    }

    try {
      const url = editMode
        ? `${API}/api/sensornodes/${selectedNode.nodeID}`
        : `${API}/api/sensornodes`;

      const method = editMode ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.text();
        console.error("❌ Failed to save node:", error);
        alert(`Failed to save node: ${error}`);
        return;
      }

      const json = await res.json();
      console.log(`✅ Node ${editMode ? "updated" : "created"}:`, json);

      await fetchNodes();
      handleCloseModal();
    } catch (err) {
      console.error("❌ Error saving node:", err);
      alert(`Error saving node: ${err.message}`);
    }
  };

  // ✅ Helper: Compute connection status
  const getConnectionStatus = (rssi, snr) => {
    if (rssi === null || rssi === undefined) return "no_connection";

    const rssiStrong = rssi > -80;
    const rssiModerate = rssi >= -100 && rssi <= -80;
    const rssiWeak = rssi < -100;

    const snrStrong = snr > 10;
    const snrModerate = snr >= 5 && snr <= 10;
    const snrWeak = snr < 5;

    if (rssiStrong && snrStrong) return "strong";
    if (rssiWeak || snrWeak) return "weak";
    return "moderate";
  };

  // ✅ Helper: Check if node can be deleted
  const canDeleteNode = (node) => {
    const signal = nodeSignals[node.nodeID];
    const connectionStatus = signal
      ? getConnectionStatus(signal.rssi, signal.snr)
      : "no_connection";

    if (!node.last_seen) {
      return connectionStatus === "no_connection";
    }

    const lastSeenDate = new Date(node.last_seen);
    const now = new Date();
    const diffMinutes = (now - lastSeenDate) / 1000 / 60;

    return (
      (connectionStatus === "weak" && diffMinutes >= 10) ||
      (connectionStatus === "no_connection" && diffMinutes >= 10)
    );
  };

  // ✅ Handle delete
  const handleDelete = async (node) => {
    const signal = nodeSignals[node.nodeID];
    const connectionStatus = signal
      ? getConnectionStatus(signal.rssi, signal.snr)
      : "no_connection";

    if (!canDeleteNode(node)) {
      alert(
        `Cannot delete this sensor node.\n\n` +
          `Deletion is only allowed if:\n` +
          `• Connection is weak AND node has been inactive for 10+ minutes, OR\n` +
          `• No connection AND node has been inactive for 10+ minutes\n\n` +
          `Current status: ${connectionStatus.toUpperCase()}\n` +
          `Last seen: ${
            node.last_seen
              ? new Date(node.last_seen).toLocaleString()
              : "Never"
          }`
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this sensor node?")) {
      return;
    }

    try {
      const params = new URLSearchParams({
        connectionStatus,
        lastSeen: node.last_seen || "",
      });

      const res = await fetch(
        `${API}/api/sensornodes/${node.nodeID}?${params}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) {
        const error = await res.json();
        console.error("❌ Failed to delete node:", error);
        alert(error.reason || "Failed to delete node");
        return;
      }

      console.log(`✅ Node ${node.nodeID} deleted`);
      await fetchNodes();
    } catch (err) {
      console.error("❌ Error deleting node:", err);
      alert("Error deleting node");
    }
  };

  // PDF Export
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
      ? apiRef.current.getVisibleColumns().filter((col) => col.field !== "actions")
      : columns.filter((col) => col.field !== "actions");

    doc.setFontSize(18);
    doc.text("Sensor Nodes Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Nodes: ${visibleRows.length}`, 40, 75);

    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = visibleRows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "last_seen") {
          return val ? new Date(val).toLocaleString() : "Never";
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

  // DataGrid columns
  const columns = [
    {
      field: "nodeID",
      headerName: "Node ID",
      width: 100,
      headerAlign: 'center',
      align: 'center',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value}
        </Text>
      ),
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" fw={500} style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value || "—"}
        </Text>
      ),
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value || "—"}
        </Text>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row: { status } }) => {
        const isActive = status === "active";
        
        return (
          <Badge
            variant="light"
            color={isActive ? "green" : "red"}
            size="sm"
            leftSection={
              isActive ? (
                <CheckCircleIcon size={12} weight="fill" />
              ) : (
                <XCircleIcon size={12} weight="fill" />
              )
            }
            style={{ fontFamily: mantineTheme.fontFamily }}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
      valueFormatter: (value) => value === "active" ? "Active" : "Inactive",
    },
    {
      field: "connection",
      headerName: "Connection",
      width: 150,
      headerAlign: 'center',
      align: 'center',
      renderCell: ({ row }) => {
        const signal = nodeSignals[row.nodeID];

        if (!signal) {
          return (
            <Text size="sm" c="dimmed" style={{ fontFamily: mantineTheme.fontFamily }}>
              No Data
            </Text>
          );
        }

        const status = getConnectionStatus(signal.rssi, signal.snr);

        const statusLabels = {
          strong: "Strong",
          moderate: "Moderate", 
          weak: "Weak",
          no_connection: "None",
        };

        return (
          <Tooltip label={`RSSI: ${signal.rssi} dBm, SNR: ${signal.snr} dB`}>
            <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
              {statusLabels[status]}
            </Text>
          </Tooltip>
        );
      },
      valueFormatter: (value, row) => {
        const signal = nodeSignals[row.nodeID];
        if (!signal) return "No Data";
        const status = getConnectionStatus(signal.rssi, signal.snr);
        const statusLabels = {
          strong: "Strong",
          moderate: "Moderate",
          weak: "Weak",
          no_connection: "None",
        };
        return statusLabels[status];
      },
    },
    {
      field: "last_seen",
      headerName: "Last Seen",
      flex: 1,
      minWidth: 180,
      headerAlign: 'left',
      align: 'left',
      renderCell: (params) => (
        <Text size="sm" style={{ fontFamily: mantineTheme.fontFamily }}>
          {params.value ? new Date(params.value).toLocaleString() : "Never"}
        </Text>
      ),
      valueFormatter: (value) => {
        return value ? new Date(value).toLocaleString() : "Never";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const deletable = canDeleteNode(row);

        return (
          <Group gap="xs">
            <Tooltip label="Edit">
              <ActionIcon
                variant="subtle"
                color="blue"
                size="sm"
                onClick={() => handleOpenModal(row)}
              >
                <PencilIcon size={16} weight="duotone" />
              </ActionIcon>
            </Tooltip>
            <Tooltip
              label={
                deletable
                  ? "Delete"
                  : "Cannot delete (see conditions)"
              }
            >
              <ActionIcon
                variant="subtle"
                color="red"
                size="sm"
                onClick={() => handleDelete(row)}
                disabled={!deletable}
                style={{
                  opacity: deletable ? 1 : 0.3,
                  cursor: deletable ? "pointer" : "not-allowed",
                }}
              >
                <TrashIcon size={16} weight="duotone" />
              </ActionIcon>
            </Tooltip>
          </Group>
        );
      },
    },
  ];

    // ✅ Custom Toolbar Component with Add Node Button
  function CustomToolbar({ apiRef, onPdfExport, onAddNode }) {
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const [densityMenuOpen, setDensityMenuOpen] = useState(false);
    const exportMenuTriggerRef = React.useRef(null);
    const densityMenuTriggerRef = React.useRef(null);

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

        {/* Density Button */}
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

        {/* ✅ Add Node Button - positioned before search */}
        <ToolbarButton
          onClick={onAddNode}
          render={
            <Button 
              startIcon={<PlusIcon size={18} weight="bold" />}
              sx={{ 
                marginLeft: 'auto',
                fontWeight: 600,
                backgroundColor: colorScheme === 'dark' ? colors.frostedMint[6] : colors.frostedMint[5],
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colorScheme === 'dark' ? colors.frostedMint[7] : colors.frostedMint[6],
                },
              }}
            >
              Add Node
            </Button>
          }
        />

        {/* Search Quick Filter */}
        <QuickFilter
          render={(props, state) => (
            <div {...props} style={{ display: 'flex', overflow: 'clip' }}>
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
        title="Sensor Nodes"
        subtitle={`Manage all sensor nodes • WebSocket: ${connectionStatus} • Total Nodes: ${rows.length}`}
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
            showToolbar
            density={density}
            slots={{ toolbar: CustomToolbar }}
            slotProps={{
              toolbar: { 
                apiRef, 
                onPdfExport: handlePdfExport,
                onAddNode: () => handleOpenModal()
              },
            }}
            rows={rows}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { 
                paginationModel: { pageSize: 25, page: 0 } 
              },
              filter: {
                filterModel: {
                  items: [],
                  quickFilterLogicOperator: GridLogicOperator.Or,
                },
              },
            }}
            getRowId={(row) => row.nodeID}
            disableRowSelectionOnClick
          />
        </ThemeProvider>
      </Box>

      {/* ✅ Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={
          <Text fw={600} size="lg" style={{ fontFamily: mantineTheme.fontFamily }}>
            {editMode ? "Edit Sensor Node" : "Add New Sensor Node"}
          </Text>
        }
        size="md"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        <Box p="sm">
          <form onSubmit={handleSubmit}>
            <Stack gap="md">
              <TextInput
                label="Node Name"
                placeholder="Enter node name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.currentTarget.value })
                }
                required
                size="sm"
                styles={{
                  label: { fontFamily: mantineTheme.fontFamily, fontWeight: 500 },
                  input: { fontFamily: mantineTheme.fontFamily }
                }}
              />

              <Textarea
                label="Description"
                placeholder="Enter node description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.currentTarget.value })
                }
                rows={3}
                size="sm"
                styles={{
                  label: { fontFamily: mantineTheme.fontFamily, fontWeight: 500 },
                  input: { fontFamily: mantineTheme.fontFamily }
                }}
              />

              <Select
                label="Initial Status"
                value={formData.status}
                onChange={(value) =>
                  setFormData({ ...formData, status: value || "inactive" })
                }
                data={[
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive" },
                ]}
                size="sm"
                styles={{
                  label: { fontFamily: mantineTheme.fontFamily, fontWeight: 500 },
                  input: { fontFamily: mantineTheme.fontFamily }
                }}
              />

              <Group justify="flex-end" gap="sm" mt="md">
                <MantineButton 
                  variant="outline" 
                  onClick={handleCloseModal}
                  size="sm"
                  style={{ fontFamily: mantineTheme.fontFamily }}
                >
                  Cancel
                </MantineButton>
                <MantineButton 
                  type="submit" 
                  color={editMode ? "blue" : "green"}
                  size="sm"
                  leftSection={editMode ? <PencilIcon size={16} /> : <PlusIcon size={16} />}
                  style={{ fontFamily: mantineTheme.fontFamily }}
                >
                  {editMode ? "Update Node" : "Create Node"}
                </MantineButton>
              </Group>
            </Stack>
          </form>
        </Box>
      </Modal>
    </Box>
  );
};

export default SensorNodes;