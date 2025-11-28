import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  useTheme,
  Modal,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from "@mui/material";
import { tokens } from "../../theme";
import Header from "../../components/Header";
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
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import SearchIcon from "@mui/icons-material/Search";
import CancelIcon from "@mui/icons-material/Cancel";
import Badge from "@mui/material/Badge";
import Menu from "@mui/material/Menu";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import { styled } from "@mui/material/styles";
import Chip from "@mui/material/Chip";
import CircleIcon from "@mui/icons-material/Circle";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import SignalCellular4BarIcon from "@mui/icons-material/SignalCellular4Bar";
import SignalCellular2BarIcon from "@mui/icons-material/SignalCellular2Bar";
import SignalCellular0BarIcon from "@mui/icons-material/SignalCellular0Bar";
import SignalCellularNoSimIcon from "@mui/icons-material/SignalCellularNoSim";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useWebSocket } from "../../hooks/useWebSocket";

const SensorNodes = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const apiRef = useGridApiRef();

  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");

  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
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

  // Modal handlers
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
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setEditMode(false);
    setSelectedNode(null);
    setFormData({ name: "", description: "", status: "inactive" });
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        alert("Failed to save node");
        return;
      }

      const json = await res.json();
      console.log(
        `✅ Node ${editMode ? "updated" : "created"}:`,
        json
      );

      // Refresh nodes list
      await fetchNodes();
      handleCloseModal();
    } catch (err) {
      console.error("❌ Error saving node:", err);
      alert("Error saving node");
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

  // ✅ Update handleDelete to include validation
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

  // DataGrid columns
  const columns = [
    {
      field: "nodeID",
      headerName: "Node ID",
      width: 100,
    },
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "description",
      headerName: "Description",
      flex: 2,
      minWidth: 200,
      renderCell: (params) => (
        <Typography variant="body2">
          {params.value || "—"}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: ({ row: { status } }) => (
        <Chip
          variant="outlined"
          color={status === "active" ? "success" : "error"}
          size="small"
          icon={<CircleIcon />}
          label={status === "active" ? "Active" : "Inactive"}
        />
      ),
    },
    // ✅ New Connection Status Column
    {
      field: "connection",
      headerName: "Connection",
      width: 150,
      renderCell: ({ row }) => {
        const signal = nodeSignals[row.nodeID];

        if (!signal) {
          return (
            <Chip
              variant="outlined"
              size="small"
              icon={<SignalCellularNoSimIcon />}
              label="No Data"
              sx={{ color: colors.grey[500], borderColor: colors.grey[500] }}
            />
          );
        }

        const status = getConnectionStatus(signal.rssi, signal.snr);

        const statusConfig = {
          strong: {
            icon: <SignalCellular4BarIcon />,
            label: "Strong",
            color: colors.green[500],
          },
          moderate: {
            icon: <SignalCellular2BarIcon />,
            label: "Moderate",
            color: colors.orange[500],
          },
          weak: {
            icon: <SignalCellular0BarIcon />,
            label: "Weak",
            color: colors.red[500],
          },
          no_connection: {
            icon: <SignalCellularNoSimIcon />,
            label: "None",
            color: colors.grey[500],
          },
        };

        const config = statusConfig[status];

        return (
          <Tooltip title={`RSSI: ${signal.rssi} dBm, SNR: ${signal.snr} dB`}>
            <Chip
              variant="outlined"
              size="small"
              icon={config.icon}
              label={config.label}
              sx={{
                color: config.color,
                borderColor: config.color,
              }}
            />
          </Tooltip>
        );
      },
    },
    {
      field: "last_seen",
      headerName: "Last Seen",
      flex: 1,
      minWidth: 180,
      renderCell: (params) => (
        <span>
          {params.value ? new Date(params.value).toLocaleString() : "Never"}
        </span>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => {
        const deletable = canDeleteNode(row);

        return (
          <Box display="flex" gap={1}>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                color="primary"
                onClick={() => handleOpenModal(row)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip
              title={
                deletable
                  ? "Delete"
                  : "Cannot delete (see conditions)"
              }
            >
              <span>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(row)}
                  disabled={!deletable}
                  sx={{
                    opacity: deletable ? 1 : 0.3,
                    cursor: deletable ? "pointer" : "not-allowed",
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

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

  // Custom Toolbar Styling
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

  // Custom Toolbar Component
  function CustomToolbar({ apiRef, onPdfExport, onAddNode }) {
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const exportMenuTriggerRef = React.useRef(null);

    return (
      <Toolbar>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddNode}
          sx={{
            mr: 2,
            backgroundColor: colors.green[700],
            "&:hover": { backgroundColor: colors.green[800] },
          }}
        >
          Add Node
        </Button>

        <Tooltip title="Columns">
          <ColumnsPanelTrigger render={<ToolbarButton />}>
            <ViewColumnIcon fontSize="small" />
          </ColumnsPanelTrigger>
        </Tooltip>

        <Tooltip title="Filters">
          <FilterPanelTrigger
            render={(props, state) => (
              <ToolbarButton {...props} color="default">
                <Badge
                  badgeContent={state.filterCount}
                  color="primary"
                  variant="dot"
                >
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
        title="Sensor Nodes"
        subtitle={`Manage all sensor nodes • WebSocket: ${connectionStatus}`}
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
            toolbar: {
              apiRef,
              onPdfExport: handlePdfExport,
              onAddNode: () => handleOpenModal(),
            },
          }}
          showToolbar
          pageSizeOptions={[10, 25, 50, 100]}
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          getRowId={(row) => row.nodeID}
        />
      </Box>

      {/* Add/Edit Modal */}
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
            width: 500,
          }}
        >
          <Typography variant="h4" mb={3} fontWeight={600}>
            {editMode ? "Edit Sensor Node" : "Add New Sensor Node"}
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Node Name"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
              margin="normal"
            />

            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              multiline
              rows={3}
              margin="normal"
            />

            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                label="Status"
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>

            <Box display="flex" justifyContent="flex-end" gap={2} mt={3}>
              <Button onClick={handleCloseModal} variant="outlined">
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                {editMode ? "Update" : "Create"}
              </Button>
            </Box>
          </form>
        </Box>
      </Modal>
    </Box>
  );
};

export default SensorNodes;