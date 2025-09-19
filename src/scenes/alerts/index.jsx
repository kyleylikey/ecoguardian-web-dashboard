import {Box, Typography, useTheme} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Toolbar, ToolbarButton } from '@mui/x-data-grid';
import { tokens } from "../../theme";
import { mockDataAlerts } from "../../data/mockData";
import Header from "../../components/Header"; 

//icons
import WhatshotIcon from '@mui/icons-material/Whatshot';
import ParkIcon from '@mui/icons-material/Park';
import PetsIcon from '@mui/icons-material/Pets';

const Alerts = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "type", 
            headerName: "Type", 
            flex: 1,
            renderCell: ({row: {type}}) => {
            //     let icon_color;
            //     if (type === "Wildfire Risk") icon_color = colors.red[500];
            //     else if (type === "Illegal Logging") icon_color = colors.brown[500];
            //     else if (type === "Poaching") icon_color = colors.blue[500];
            //     else icon_color = colors.grey[600];
                
            //     let text_color;
            //     if (type === "Wildfire Risk") text_color = colors.red[200];
            //     else if (type === "Illegal Logging") text_color = colors.brown[200];
            //     else if (type === "Poaching") text_color = colors.blue[200];
            //     else text_color = colors.grey[100];

                return (
                    <Box
                        sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        height: "100%", // optional, helps in some DataGrid configs
                        }}
                    >
                        {type === "Wildfire Risk" && <WhatshotIcon sx={{ fontSize: 20, verticalAlign: "middle" }} />}
                        {type === "Illegal Logging" && <ParkIcon sx={{ fontSize: 20, verticalAlign: "middle" }} />}
                        {type === "Poaching" && <PetsIcon sx={{ fontSize: 20, verticalAlign: "middle" }} />}

                        <Typography
                            sx={{
                                fontSize: 16,
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
            cellClassName: "alert-type-column--cell", 
        },
        {
            field: "timestamp", 
            headerName: "Detected At", 
            flex: 1
        },
        {
            field: "severity", 
            headerName: "Severity Reached", 
            flex: 1,
            // renderCell: ({row: {severity}}) => {
            //     return (
            //         <Box
            //             sx={{
            //                 display: "flex",
            //                 borderRadius: "4px",
            //                 p: 1,   
            //                 gap: "5px",
            //                 alignItems: "center",
            //                 justifyContent: "center",
            //                 alignContent: "center",
            //                 width: "80%",
            //                 backgroundColor: 
            //                 severity === "High" ? colors.red[500] 
            //                 : severity === "Moderate" ? colors.orange[500] 
            //                 : severity === "Low" ? colors.yellow[500]
            //                 : "transparent"
            //             }}
            //         >
            //             {severity ? severity : "N/A"}
            //         </Box>
            //     )
            // },
        },
        {
            field: "status", 
            headerName: "Status", 
            flex: 1,
            // renderCell: ({row: {status}}) => {
            //     return (
            //         <Box
            //             sx={{
            //                 display: "flex",
            //                 alignItems: "center",
            //                 gap: "5px",
            //                 borderRadius: "4px",
            //                 p: 1,
            //                 alignContent: "center",
            //                 justifyContent: "center",
            //                 width: "80%",
            //                 backgroundColor: 
            //                 status === "Active" ? colors.green[500] 
            //                 : status === "Resolved" ? colors.blue[700] 
            //                 : status === "N/A" ? "transparent"
            //                 : "transparent",
            //             }}
            //         >
            //             {status ? status : "N/A"}
            //         </Box>
            //     )
            // },
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