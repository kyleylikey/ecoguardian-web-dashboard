import {Box, Typography, useTheme} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Chip from '@mui/material/Chip';
import { tokens } from "../../theme";
import { mockDataAlerts } from "../../data/mockData";
import Header from "../../components/Header"; 

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
            minWidth: 200,
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
            minWidth: 150,
        },
        {
            field: "timestamp", 
            headerName: "Detected At", 
            minWidth: 200,
        },
        {
            field: "severity", 
            headerName: "Severity Reached", 
            minWidth: 180,
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
            minWidth: 200,
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
                        backgroundColor: colors.blue[700],
                        borderBottom: "none",
                    },
                    "& .MuiDataGrid-footerContainer": {
                        backgroundColor: colors.blue[700],
                        borderBottom: "none",
                    },
                }}
            >
                <DataGrid
                    rows = {mockDataAlerts}
                    columns = {columns}
                />
            </Box>
        </Box>
    )

};

export default Alerts;