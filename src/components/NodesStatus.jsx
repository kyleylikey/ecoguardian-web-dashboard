import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";


import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem'; 
import { Typography, Box } from "@mui/material";
import CircleIcon from '@mui/icons-material/Circle';
import Chip from '@mui/material/Chip';

const NodesStatus = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const [sensorNodes, setSensorNodes] = useState([]);

    useEffect(() => {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || ""; // empty = use same origin
        const base = API_BASE.replace(/\/$/, "");
        const sseUrl = `${base}/sse/sensornodes`;
        const fetchUrl = `${base}/api/sensornodes`;

        const normalize = (n) => {
            const id = (n?.id ?? n?.nodeID) ?? null;
            const name = n?.name ?? n?.nodeName ?? (id ? `Node ${id}` : "Unknown Node");
            const statusRaw = (n?.status ?? n?.state ?? "inactive").toString();
            const status = statusRaw.trim().toLowerCase() === "active" ? "active" : "inactive";
            return { id, name, status };
        };

        const fetchAll = async () => {
            try {
                const res = await fetch(fetchUrl);
                if (!res.ok) {
                    console.error("Failed fetching nodes:", res.status, await res.text());
                    return;
                }
                const json = await res.json();
                const nodes = (json?.data || json || []).map(normalize);
                setSensorNodes(nodes);
            } catch (err) {
                console.error("Error fetching sensor nodes:", err);
            }
        };

        fetchAll();
        let es;
        try {
            es = new EventSource(sseUrl);
            es.addEventListener("sensornode", (e) => {
                try {
                    const msg = JSON.parse(e.data);
                    const n = normalize(msg.data);
                    if (!n?.id) return;
                    setSensorNodes((prev) => {
                        const exists = prev.find((p) => p.id === n.id);
                        if (exists) {
                            return prev.map((p) => (p.id === n.id ? n : p));
                        } else {
                            return [...prev, n];
                        }
                    });
                } catch (err) {
                    console.error("Error processing SSE message:", err);
                }
            });
        } catch (err) {
            console.error("Error setting up SSE:", err);
        }

        return () => {
            if (es) {
                es.close();
            }
        };
    }, []);

    if (!sensorNodes || sensorNodes.length === 0) {
        return <Typography>No nodes found.</Typography>;
    }

    return (
        <Box sx={{height: "100%", overflowY: "scroll", paddingRight: 1}}>
            <List>
                {sensorNodes.map((node) => (
                    <ListItem key={node.id} disablePadding sx={{ mb: 1 }}>
                        <Box
                            sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                width: "100%",
                                backgroundColor: colors.grey[900], 
                                padding: 1.2,
                                borderRadius: 1,
                            }}
                        >

                        <Typography sx={{ flexGrow: 1 }}>
                            {node.name}
                        </Typography>
                        
                        <Chip
                            variant="outlined"
                            color={node.status === "active" ? "success" : "error"}
                            size="small"
                            icon={<CircleIcon />}
                            label={node.status === "active" ? "Active" : "Inactive"}
                            sx={{
                                ml: 1,
                                fontWeight: node.status === "active" ? 600 : 400,
                            }}
                        />
                        </Box>
                    </ListItem>
                ))}
            </List>
        </Box>
    );
}

export default NodesStatus;