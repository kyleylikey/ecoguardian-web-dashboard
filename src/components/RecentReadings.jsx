import React from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import {mockDataReadings} from "../data/mockData";

const RecentReadings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    // sort readings by timestamp (descending)
    const sortedReadings = [...mockDataReadings].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
    const recentReadings = sortedReadings.slice(0, 6);
    
    return (
    <TableContainer
        sx={{
        backgroundColor: colors.black[400],
        maxHeight: "100%",
        overflowY: "auto",
        color: colors.grey[100],
        borderRadius: 1,
        }}
    >
        <Table stickyHeader>
            <TableHead>
                <TableRow>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>ID</TableCell>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Timestamp</TableCell>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Detected By</TableCell>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Temperature (°C)</TableCell>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Humidity (%)</TableCell>
                <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>CO Level (ppm)</TableCell>
                </TableRow>
            </TableHead>
            
            <TableBody>
                {recentReadings.map((reading) => (
                <TableRow key={reading.id} hover>
                    <TableCell sx={{ color: colors.grey[100] }}>{reading.id}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>
                    {new Date(reading.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{reading.node}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{reading.temp}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{reading.humidity}</TableCell>
                    <TableCell sx={{ color: colors.grey[100] }}>{reading.co_lvl}</TableCell>
                </TableRow>
                ))}
            </TableBody>
        </Table>
    </TableContainer>
    );
}

export default RecentReadings;