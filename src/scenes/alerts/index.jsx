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
} from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import Badge from "@mui/material/Badge";
import ViewColumnIcon from "@mui/icons-material/ViewColumn";
import FilterListIcon from "@mui/icons-material/FilterList";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import ParkIcon from "@mui/icons-material/Park";
import PetsIcon from "@mui/icons-material/Pets";
import CheckIcon from "@mui/icons-material/Check";
import ErrorIcon from "@mui/icons-material/Error";

const Alerts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const apiRef = useGridApiRef();

  const [rows, setRows] = useState([]);

  // format confidence (0..1 -> percent, otherwise show raw)
  const formatConfidence = (c) => {
    if (c === null || c === undefined) return "N/A";
    const n = Number(c);
    if (!isNaN(n)) return n <= 1 ? `${(n * 100).toFixed(1)}%` : String(n);
    return String(c);
  };

  // resolve timestamp picker: prefer resolved_at, fallback to resolvedAt, else if resolved true use detection timestamp
  const pickResolvedTimestamp = (r) => {
    return r.resolved_at ?? r.resolvedAt ?? (r.resolved ? r.timestamp : null);
  };

  const columns = [
    { field: "id", headerName: "ID" },
    {
      field: "type",
      headerName: "Type",
      flex: 1,
      renderCell: ({ row: { type } }) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: "5px", height: "100%" }}>
          {type === "Wildfire Risk" && <WhatshotIcon sx={{ fontSize: 16 }} />}
          {type === "Illegal Logging" && <ParkIcon sx={{ fontSize: 16 }} />}
          {type === "Poaching" && <PetsIcon sx={{ fontSize: 16 }} />}
          <Typography sx={{ fontSize: 13 }}>{type}</Typography>
        </Box>
      ),
    },
    { field: "node", headerName: "Detected By", flex: 1 },
    {
      field: "timestamp",
      headerName: "Detected At",
      flex: 1,
      renderCell: (params) => <span>{params.row.timestamp ? new Date(params.row.timestamp).toLocaleString() : ""}</span>,
    },
    {
      field: "severity",
      headerName: "Severity Reached",
      flex: 1,
      renderCell: ({ row: { severity } }) => {
        const colorMap = {
          High: colors.red[500],
          Moderate: colors.orange[500],
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
      renderCell: ({ row: { confidence } }) => <span>{formatConfidence(confidence)}</span>,
    },
    {
      field: "resolved",
      headerName: "Resolved At",
      flex: 1,
      renderCell: (params) => (
        <span>{params.row.resolved ? new Date(params.row.resolved).toLocaleString() : ""}</span>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: ({ row: { status } }) =>
        status === "Active" ? (
          <Chip variant="outlined" color="error" size="small" icon={<ErrorIcon />} label={status} />
        ) : status === "Resolved" ? (
          <Chip variant="outlined" color="success" size="small" icon={<CheckIcon />} label={status} />
        ) : (
          <Chip variant="outlined" color="default" size="small" label="N/A" />
        ),
    },
  ];

  // map backend risk row -> UI row
  const mapRisk = (r) => {
    const typeMap = { fire: "Wildfire Risk", chainsaw: "Illegal Logging", gunshots: "Poaching" };
    const severityMap = { high: "High", medium: "Moderate", low: "Low" };
    const id = r.id ?? r.riskID ?? r.riskId;
    const nodeLabel = r.nodeName ?? (r.nodeID ? `Node ${r.nodeID}` : r.nodeID ?? "Unknown");
    const type = typeMap[r.risk_type] || (r.risk_type ? String(r.risk_type) : "Unknown");
    const severity = severityMap[String(r.risk_level || "").toLowerCase()] || (r.risk_level ? String(r.risk_level) : null);
    const status = r.resolved ? "Resolved" : "Active";
    return {
      id,
      type,
      node: nodeLabel,
      timestamp: r.timestamp,
      severity,
      resolved: pickResolvedTimestamp(r) ?? null,
      confidence: r.confidence ?? null,
      status,
      // keep raw row for potential detail modal
      _raw: r,
    };
  };

  useEffect(() => {
    const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";
    const listUrl = `${base}/api/riskdetection`;
    const sseUrl = `${base}/sse/risks`;

    let es;

    const fetchAll = async () => {
      try {
        const res = await fetch(listUrl);
        if (!res.ok) {
          console.error("Failed to fetch risks:", res.status, await res.text());
          return;
        }
        const json = await res.json();
        const data = (json?.data || []).map(mapRisk);
        setRows(data);
      } catch (err) {
        console.error("Error fetching risks:", err);
      }
    };

    fetchAll();

    // SSE - live updates
    try {
      es = new EventSource(sseUrl);
      es.addEventListener("risk_created", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          if (!payload) return;
          const mapped = mapRisk(payload);
          setRows((prev) => [mapped, ...prev]);
        } catch (err) {}
      });

      es.addEventListener("risk_updated", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          if (!payload) return;
          const mapped = mapRisk(payload);
          setRows((prev) => prev.map(r => String(r.id) === String(mapped.id) ? { ...r, ...mapped } : r));
        } catch (err) {
          console.warn("Invalid SSE risk_updated payload", err);
        }
      });

      es.addEventListener("risk_resolved", (e) => {
        try {
          const payload = JSON.parse(e.data)?.data;
          const resolvedId = payload?.riskID ?? payload?.id;
          if (!resolvedId) return;
          setRows((prev) => prev.map((r) => (String(r.id) === String(resolvedId) ? { ...r, status: "Resolved", resolved: payload?.resolved ?? new Date().toISOString() } : r)));
        } catch (err) {}
      });

      es.onerror = (err) => {
        console.warn("SSE error", err);
        // EventSource will try to reconnect by default
      };
    } catch (err) {
      console.warn("Failed to open SSE:", err);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // ✅ PDF Export (unchanged) - use `rows` instead of mockDataAlerts
  const handlePdfExport = (orientation = "portrait") => {
    if (!apiRef.current) return;
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

    const visibleColumns = apiRef.current.getVisibleColumns();
    const sortedFilteredRowIds = apiRef.current.getSortedRowIds();
    const dataRows = sortedFilteredRowIds.map((id) => apiRef.current.getRow(id));

    doc.setFontSize(18);
    doc.text("Alert Activity Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Rows: ${dataRows.length}`, 40, 75);

    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = dataRows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "timestamp" || col.field === "resolved") {
          return val ? new Date(val).toLocaleString() : "";
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
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() - 80, doc.internal.pageSize.getHeight() - 20);
    }

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

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
              <ToolbarButton {...props}>
                <Badge badgeContent={state.filterCount} color="primary" variant="dot">
                  <FilterListIcon fontSize="small" />
                </Badge>
              </ToolbarButton>
            )}
          />
        </Tooltip>

        <Divider orientation="vertical" variant="middle" flexItem sx={{ mx: 0.5 }} />

        <Tooltip title="Export">
          <ToolbarButton ref={exportMenuTriggerRef} onClick={() => setExportMenuOpen(true)}>
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>

        <Menu anchorEl={exportMenuTriggerRef.current} open={exportMenuOpen} onClose={() => setExportMenuOpen(false)} anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
          <MenuItem
            onClick={() => {
              setExportMenuOpen(false);
              handlePdfExport("portrait");
            }}
          >
            Export as PDF (Portrait)
          </MenuItem>

          <MenuItem
            onClick={() => {
              setExportMenuOpen(false);
              handlePdfExport("landscape");
            }}
          >
            Export as PDF (Landscape)
          </MenuItem>

          <ExportCsv render={<MenuItem />} onClick={() => setExportMenuOpen(false)}>
            Download as CSV
          </ExportCsv>
        </Menu>
      </Toolbar>
    );
  }

  return (
    <Box m="20px">
      <Header title="Alerts" subtitle="View active and all past alerts" />
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
        <DataGrid apiRef={apiRef} rows={rows} columns={columns} slots={{ toolbar: CustomToolbar }} showToolbar pageSizeOptions={[10, 25, 50]} initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }} />
      </Box>
    </Box>
  );
};

export default Alerts;
