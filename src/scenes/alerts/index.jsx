import React from "react";
import { Box, Typography, useTheme } from "@mui/material";
import Chip from "@mui/material/Chip";
import { tokens } from "../../theme";
import { mockDataAlerts } from "../../data/mockData";
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
      renderCell: (params) => <span>{new Date(params.row.timestamp).toLocaleString()}</span>,
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
      field: "res_ack_timestamp",
      headerName: "Resolved By",
      flex: 1,
      renderCell: (params) => (
        <span>
          {params.row.res_ack_timestamp ? new Date(params.row.res_ack_timestamp).toLocaleString() : ""}
        </span>
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

  // ✅ PDF Export respecting filters, sorts, and column visibility
  const handlePdfExport = (orientation = "portrait") => {
    if (!apiRef.current) return;
    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });

    // Get visible columns (respects column visibility)
    const visibleColumns = apiRef.current.getVisibleColumns();

    // Get sorted + filtered row IDs (respects filter panel + sorting)
    const sortedFilteredRowIds = apiRef.current.getSortedRowIds();
    const rows = sortedFilteredRowIds.map((id) => apiRef.current.getRow(id));

    // HEADER
    doc.setFontSize(18);
    doc.text("Alert Activity Report", 40, 40);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 60);
    doc.text(`Total Rows: ${rows.length}`, 40, 75);

    // TABLE
    const tableColumn = visibleColumns.map((col) => col.headerName || col.field);
    const tableRows = rows.map((row) =>
      visibleColumns.map((col) => {
        const val = row[col.field];
        if (col.field === "timestamp" || col.field === "res_ack_timestamp") {
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

    // FOOTER
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() - 80,
        doc.internal.pageSize.getHeight() - 20
      );
    }

    // ✅ Open PDF in a new tab
    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, "_blank");
  };

  // ✅ Toolbar (no search)
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
          <ToolbarButton
            ref={exportMenuTriggerRef}
            onClick={() => setExportMenuOpen(true)}
          >
            <FileDownloadIcon fontSize="small" />
          </ToolbarButton>
        </Tooltip>

        <Menu
          anchorEl={exportMenuTriggerRef.current}
          open={exportMenuOpen}
          onClose={() => setExportMenuOpen(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
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
        <DataGrid
          apiRef={apiRef}
          rows={mockDataAlerts}
          columns={columns}
          slots={{ toolbar: CustomToolbar }}
          showToolbar
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10, page: 0 } },
          }}
        />
      </Box>
    </Box>
  );
};

export default Alerts;
