import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useWebSocket } from "../hooks/useWebSocket";

const MAX_ROWS = 5;

const LatestReadings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const WS_URL = API.replace(/^http/, "ws");

    const { lastMessage } = useWebSocket(WS_URL);
    const [latest, setLatest] = useState([]);

    // Initial fetch
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/api/readings?limit=5`);
                if (!res.ok) return;
                
                const json = await res.json();
                const rows = (json?.readings || []).map(r => ({
                    id: r.readingID,
                    timestamp: r.timestamp,
                    node: r.nodeID,
                    temp: r.temperature,
                    humidity: r.humidity,
                    co_lvl: r.co_level,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    altitude: r.altitude,
                    fix: r.fix,
                }));
                setLatest(rows.slice(0, MAX_ROWS));
                console.log(`✅ Loaded ${rows.length} latest readings`);
            } catch (err) {
                console.error("Error fetching readings:", err);
            }
        })();
    }, [API]);

    // WebSocket updates
    useEffect(() => {
        if (!lastMessage) return;

        if (lastMessage.event === "new_reading") {
            const newReading = {
                id: lastMessage.data?.readingID,
                timestamp: lastMessage.timestamp,
                node: lastMessage.data?.nodeID,
                temp: lastMessage.data?.temperature,
                humidity: lastMessage.data?.humidity,
                co_lvl: lastMessage.data?.co_level,
                latitude: lastMessage.data?.location?.latitude,
                longitude: lastMessage.data?.location?.longitude,
                altitude: lastMessage.data?.location?.altitude,
                fix: lastMessage.data?.location?.fix,
            };

            setLatest(prev => {
                if (prev.some(r => r.id === newReading.id)) return prev;
                return [newReading, ...prev].slice(0, MAX_ROWS);
            });
        }
    }, [lastMessage]);

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
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Node</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Temp (°C)</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Humidity (%)</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>CO (ppm)</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Latitude</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Longitude</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Altitude</TableCell>
                        <TableCell sx={{ color: colors.grey[100], backgroundColor: colors.black[400] }}>Fix</TableCell>
                    </TableRow>
                </TableHead>

                <TableBody>
                    {latest.map((reading) => (
                        <TableRow key={reading.id} hover>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.id}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.timestamp ? new Date(reading.timestamp).toLocaleString() : ""}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.node}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.temp != null ? reading.temp.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.humidity != null ? reading.humidity.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.co_lvl ?? "—"}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.latitude != null ? reading.latitude.toFixed(6) : "—"}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.longitude != null ? reading.longitude.toFixed(6) : "—"}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>
                                {reading.altitude != null ? reading.altitude.toFixed(1) : "—"}
                            </TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.fix ? "Yes" : "No"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default LatestReadings;