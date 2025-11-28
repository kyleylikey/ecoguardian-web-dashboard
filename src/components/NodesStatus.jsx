import React, { useEffect, useState } from "react";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem'; 
import { Typography, Box } from "@mui/material";
import CircleIcon from '@mui/icons-material/Circle';
import Chip from '@mui/material/Chip';
import { useWebSocket } from "../hooks/useWebSocket";

const NodesStatus = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const WS_URL = API.replace(/^http/, "ws");

    const { lastMessage, connectionStatus } = useWebSocket(WS_URL);
    const [sensorNodes, setSensorNodes] = useState([]);

    // Initial fetch
    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`${API}/api/sensornodes`);
                if (!res.ok) {
                    console.error("Failed to fetch nodes:", res.status);
                    return;
                }
                const json = await res.json();
                const nodes = (json?.nodes || []).map(n => ({
                    id: n.nodeID,
                    name: n.name || `Node ${n.nodeID}`,
                    status: n.status || "inactive",
                    last_seen: n.last_seen,
                }));
                setSensorNodes(nodes);
                console.log(`✅ Loaded ${nodes.length} sensor nodes`);
            } catch (err) {
                console.error("Error fetching sensor nodes:", err);
            }
        })();
    }, [API]);

    // WebSocket updates
    useEffect(() => {
        if (!lastMessage) return;

        // Handle new readings (update last_seen)
        if (lastMessage.event === "new_reading") {
            const nodeID = lastMessage.data?.nodeID;
            const timestamp = lastMessage.timestamp;

            if (nodeID) {
                setSensorNodes(prev =>
                    prev.map(node =>
                        node.id === nodeID
                            ? { ...node, last_seen: timestamp, status: "active" }
                            : node
                    )
                );
            }
        }

        // Handle node status changes (if you add this event later)
        if (lastMessage.event === "node_status_changed") {
            const { nodeID, status } = lastMessage.data;
            setSensorNodes(prev =>
                prev.map(node =>
                    node.id === nodeID ? { ...node, status } : node
                )
            );
        }
    }, [lastMessage]);

    if (!sensorNodes || sensorNodes.length === 0) {
        return <Typography color={colors.grey[400]}>No nodes found.</Typography>;
    }

    return (
        <Box sx={{height: "100%", overflowY: "auto", paddingRight: 1}}>
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