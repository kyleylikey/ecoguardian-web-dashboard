import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

const MAX_ROWS = 5;

const LatestReadings = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const [latest, setLatest] = useState([]);

    useEffect(() => {
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
        const sseUrl = `${API_BASE_URL.replace(/\/$/, "")}/sse/readings`;
        const fetchUrl = `${API_BASE_URL.replace(/\/$/, "")}/api/readings`;

        const normalize = (r) => ({
            id: r.id ?? r.sensorReadingID ?? null,
            timestamp: r.timestamp,
            node: r.nodeID ?? r.node,
            temp: r.temperature ?? r.temp,
            humidity: r.humidity,
            co_lvl: r.co_level ?? r.co_lvl,
            latitude: r.latitude ?? r.gps?.latitude ?? null,
            longitude: r.longitude ?? r.gps?.longitude ?? null,
            altitude: r.altitude ?? r.gps?.altitude ?? null,
            fix: r.fix ?? Boolean(r.gps?.fix) ?? false,
        });

        const fetchAll = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/readings`);
                const json = await res.json();
                const rows = (json?.data || json || []).map(normalize);
                setLatest(rows.slice(0, MAX_ROWS));
            } catch (err) {
                console.error("Error fetching readings:", err);
            }
        };

        fetchAll();

        let es;
        try {
            es = new EventSource(sseUrl);
            es.addEventListener("reading", (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    const r = normalize(msg.data);
                    if (!r?.id) return;
                    setLatest((prev) => {
                        if (prev.some((p) => p.id === r.id)) return prev;
                        return [r, ...prev].slice(0, MAX_ROWS);
                    });
                } catch (err) {
                    console.error("Invalid SSE message", err);
                }
            });
            es.onerror = (err) => {
                console.error("SSE error", err);
            };
        } catch (err) {
            console.error("Failed to open SSE", err);
        }

        return () => {
            if (es) es.close();
        };
    }, []);

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
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.temp}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.humidity}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.co_lvl}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.latitude ?? "—"}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.longitude ?? "—"}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.altitude ?? "—"}</TableCell>
                            <TableCell sx={{ color: colors.grey[100] }}>{reading.fix ? "Yes" : "No"}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default LatestReadings;