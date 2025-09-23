import {Box, Checkbox, Typography, useTheme} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import { mockDataReadings } from "../../data/mockData";
import Header from "../../components/Header"; 
import { WrapText } from "lucide-react";

//icons


const Readings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "timestamp", 
            headerName: "Timestamp",
            minWidth: 200,
        },
        {
            field: "node", 
            headerName: "Detected By",
            minWidth: 150,
        },
        {
            field: "temp", 
            headerName: "Temperature (°C)",
            flex: 1
        },
        {
            field: "humidity", 
            headerName: "Humidity (%)",
            flex: 1
        },
        {
            field: "co_lvl", 
            headerName: "CO Level (ppm)",
            flex: 1
        },
    ]

    return (
        <Box 
            margin={"20px"}
            >
            <Header 
                title="Environmental Readings" 
                subtitle="View all past and incoming environmental readings"
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
                    rows = {mockDataReadings}
                    columns = {columns}
                    pageSizeOptions={[10, 25, 50]}
                    initialState={{
                        pagination: {
                        paginationModel: { pageSize: 25, page: 0 },
                        },
                    }}
                />
            </Box>
        </Box>
    )

};

export const columns = [
        {field: "id", headerName: "ID"}, //headerName is the label in the table, field is the value 
        {
            field: "timestamp", 
            headerName: "Timestamp",
            flex: 1
        },
        {
            field: "node", 
            headerName: "Detected By",
        },
        {
            field: "temp", 
            headerName: "Temperature (°C)",
            flex: 1
        },
        {
            field: "humidity", 
            headerName: "Humidity (%)",
            flex: 1
        },
        {
            field: "co_lvl", 
            headerName: "CO Level (ppm)",
            flex: 1
        },
    ]
export default Readings;