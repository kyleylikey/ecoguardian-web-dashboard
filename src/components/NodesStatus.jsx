import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem'; 
import { Typography, Box } from "@mui/material";
import { mockDataNodes } from "../data/mockData";
import { useTheme } from "@mui/material";
import { tokens } from "../theme";
import CircleIcon from '@mui/icons-material/Circle';
import Chip from '@mui/material/Chip';


const NodesStatus = () => {
    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    if (!mockDataNodes || mockDataNodes.length === 0) {
        return <Typography>No nodes found.</Typography>;
    }

    return (
        <Box sx={{height: "100%", overflowY: "scroll", paddingRight: 1}}>
            <List>
                {mockDataNodes.map((node) => (
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
                            color={node.status === "Active" ? "success" : "error"}
                            size="small"
                            icon={<CircleIcon />}
                            label={node.status === "Active" ? "Active" : "Inactive"}
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