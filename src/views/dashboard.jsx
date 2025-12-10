import { Header } from './global/Header.jsx';
import { ActiveAlerts } from '../components/ActiveAlerts.jsx';
import { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket.js';

// Mantine imports
import { Box, SimpleGrid, Card, Text, Table } from '@mantine/core';

// Icons
import { ThermometerIcon, DropHalfIcon, TornadoIcon } from "@phosphor-icons/react";

export default function Dashboard() {
  const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
  const WS_URL = API.replace(/^http/, "ws");
  const { lastMessage, connectionStatus } = useWebSocket(WS_URL);

  // Data state
  const [nodes, setNodes] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [latestReadings, setLatestReadings] = useState([]);
  const [stats, setStats] = useState({
    lastReading: 'Loading...',
    temperature: 'N/A',
    humidity: 'N/A',
    coLevel: 'N/A'
  });
  const [nodeSignals, setNodeSignals] = useState({});

  // Helper: Connection status from RSSI/SNR
  const getConnectionStatus = (rssi, snr) => {
    if (rssi === null || rssi === undefined) return 'None';
    const rssiStrong = rssi > -80;
    const rssiWeak = rssi < -100;
    const snrStrong = snr > 10;
    const snrWeak = snr < 5;
    
    if (rssiStrong && snrStrong) return 'Strong';
    if (rssiWeak || snrWeak) return 'Weak';
    return 'Moderate';
  };

  // Helper: Map risk to alert
  const mapRisk = (r) => {
    const typeMap = { 
      fire: "Wildfire Risk", 
      chainsaw: "Illegal Logging", 
      gunshots: "Poaching" 
    };

    return {
      id: r.riskID,
      type: typeMap[r.risk_type] || "Unknown",
      node: r.nodeName || `Node ${r.nodeID}`,
      nodeID: r.nodeID,
      timestamp: r.timestamp,
      updated_at: r.updated_at,
      confidence: r.confidence,
      status: r.resolved_at ? "Resolved" : "Active",
      risk_type: r.risk_type,
      is_incident_start: r.is_incident_start,
      cooldown_counter: r.cooldown_counter,
      temperature: r.temperature,
      humidity: r.humidity,
      co_level: r.co_level,
      incidentTimestamp: r.timestamp,
    };
  };

  // ✅ Fetch initial data with proper error handling
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log("🔄 Fetching dashboard data.  ..");

        // ✅ Fetch nodes
        const nodesPromise = fetch(`${API}/api/sensornodes`)
          .then(async (res) => {
            if (!res.ok) {
              console.error(`❌ Nodes API error: ${res.status} ${res.statusText}`);
              const text = await res.text();
              console.error("Response body:", text);
              return { nodes: [] };
            }
            return res.json();
          })
          .catch((err) => {
            console.error("❌ Error fetching nodes:", err);
            return { nodes: [] };
          });

        // ✅ Fetch active risks (use the same endpoint as alerts page)
        const risksPromise = fetch(`${API}/api/risks`)
          .then(async (res) => {
            if (!res.ok) {
              console.error(`❌ Risks API error: ${res.status} ${res.statusText}`);
              const text = await res.text();
              console.error("Response body:", text);
              return { risks: [] };
            }
            const json = await res.json();
            // Filter only active risks for dashboard
            const activeRisks = (json?.risks || []).filter(r => !r.resolved_at);
            return { risks: activeRisks };
          })
          .catch((err) => {
            console.error("❌ Error fetching risks:", err);
            return { risks: [] };
          });

        // ✅ Fetch latest readings (use the same endpoint as readings page)
        const readingsPromise = fetch(`${API}/api/readings?limit=5`)
          .then(async (res) => {
            if (!res.ok) {
              console.error(`❌ Readings API error: ${res.status} ${res.statusText}`);
              const text = await res.text();
              console.error("Response body:", text);
              return { readings: [] };
            }
            return res.json();
          })
          .catch((err) => {
            console.error("❌ Error fetching readings:", err);
            return { readings: [] };
          });

        // Wait for all requests
        const [nodesData, risksData, readingsData] = await Promise.all([
          nodesPromise,
          risksPromise,
          readingsPromise
        ]);

        console.log("📊 Dashboard data received:", {
          nodes: nodesData?.nodes?.length || 0,
          risks: risksData?.risks?.length || 0,
          readings: readingsData?.readings?.length || 0
        });

        // ✅ Set nodes
        setNodes(nodesData?.nodes || []);

        // ✅ Set active alerts (filter fire incidents)
        const allActive = risksData?.risks || [];
        const filtered = allActive.filter(r => 
          r.risk_type !== "fire" || r.is_incident_start === 1
        );
        setActiveAlerts(filtered.map(mapRisk));

        // ✅ Set latest readings
        const readings = readingsData?.readings || [];
        setLatestReadings(readings);

        // ✅ Calculate stats from latest reading
        if (readings.length > 0) {
          const latest = readings[0];
          const now = Date.now();
          const readingTime = new Date(latest.timestamp).getTime();
          const secondsAgo = Math.floor((now - readingTime) / 1000);
          
          setStats({
            lastReading: secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo/60)}m ago`,
            temperature: latest.temperature ? `${latest.temperature.toFixed(1)} °C` : 'N/A',
            humidity: latest.humidity ? `${latest.humidity.toFixed(1)}%` : 'N/A',
            coLevel: latest.co_level ? `${latest.co_level} ppm` : 'N/A'
          });
        } else {
          console.log("ℹ️ No readings available for stats");
        }

        console.log("✅ Dashboard data loaded successfully");

      } catch (err) {
        console.error("❌ Error fetching dashboard data:", err);
      }
    };

    fetchDashboardData();
  }, [API]);

  // WebSocket updates
  useEffect(() => {
    if (!lastMessage) return;

    const nodeID = lastMessage.data?.nodeID;
    const rssi = lastMessage.data?.rssi;
    const snr = lastMessage.data?.snr;

    // Update signal data
    if (nodeID && rssi !== undefined && snr !== undefined) {
      setNodeSignals(prev => ({
        ...prev,
        [nodeID]: { rssi, snr, timestamp: lastMessage.timestamp }
      }));
    }

    // Update nodes last seen
    if (lastMessage.event === "new_reading" && nodeID) {
      setNodes(prev =>
        prev.map(node =>
          node.nodeID === nodeID
            ? { ...node, last_seen: lastMessage.timestamp, status: "Active" }
            : node
        )
      );

      // Update stats if it's the latest reading
      const temp = lastMessage.data?.temperature;
      const humidity = lastMessage.data?.humidity;
      const co = lastMessage.data?.co_level;

      if (temp !== undefined || humidity !== undefined || co !== undefined) {
        setStats(prev => ({
          lastReading: 'Just now',
          temperature: temp ? `${temp.toFixed(1)} °C` : prev.temperature,
          humidity: humidity ? `${humidity.toFixed(1)}%` : prev.humidity,
          coLevel: co ? `${co} ppm` : prev.coLevel
        }));

        // Add to latest readings
        setLatestReadings(prev => {
          const newReading = {
            readingID: lastMessage.data.readingID,
            nodeID,
            nodeName: prev.find(r => r.nodeID === nodeID)?.nodeName || `Node ${nodeID}`,
            timestamp: lastMessage.timestamp,
            temperature: temp,
            humidity,
            co_level: co,
            latitude: lastMessage.data.location?.latitude,
            longitude: lastMessage.data.location?.longitude,
            altitude: lastMessage.data.location?.altitude
          };
          return [newReading, ...prev.slice(0, 4)]; // Keep only 5
        });
      }
    }

    // New risk detected
    if (lastMessage.event === "risk_detected") {
      const risks = lastMessage.data?.risks || [];
      
      risks.forEach(risk => {
        // Only add new incidents to the active alerts display
        if (!risk.isNewIncident) {
          return;
        }

        const newAlert = mapRisk({
          riskID: risk.riskID,
          nodeID,
          timestamp: risk.incidentTimestamp || lastMessage.timestamp,
          updated_at: lastMessage.timestamp,
          risk_type: risk.risk_type,
          fire_risklvl: risk.risk_level,
          confidence: risk.confidence,
          resolved_at: null,
          is_incident_start: risk.isNewIncident ? 1 : 0,
          cooldown_counter: 0,
          temperature: lastMessage.data.temperature,
          humidity: lastMessage.data.humidity,
          co_level: lastMessage.data.co_level,
        });

        setActiveAlerts(prev => [newAlert, ...prev]);
      });
    }

    // Risk resolved for any risk type
    if (lastMessage.event === "fire_resolved" || 
        lastMessage.event === "fire_resolved_manual" ||
        lastMessage.event === "chainsaw_resolved" ||
        lastMessage.event === "chainsaw_resolved_manual" ||
        lastMessage.event === "gunshots_resolved" ||
        lastMessage.event === "gunshots_resolved_manual") {
      const { nodeID, incidentTimestamp, risk_type } = lastMessage.data;
      setActiveAlerts(prev =>
        prev.filter(a =>
          !(a.nodeID === nodeID && a.incidentTimestamp === incidentTimestamp && a.risk_type === risk_type)
        )
      );
    }

    if (lastMessage.event === "risk_resolved") {
      const { riskID } = lastMessage.data;
      setActiveAlerts(prev => prev.filter(a => a.id !== riskID));
    }
  }, [lastMessage]);

  // Handle resolving alerts - applies to all risk types
  const handleResolveAlert = async (alert) => {
    try {
      // Remove all alerts in the same incident from local state immediately for better UX
      setActiveAlerts(prev => 
        prev.filter(a => 
          !(a.nodeID === alert.nodeID && 
            a.incidentTimestamp === alert.incidentTimestamp && 
            a.risk_type === alert.risk_type)
        )
      );
    } catch (err) {
      console.error("❌ Error resolving alert:", err);
    }
  };

  // Table rows for nodes
  const nodesRows = nodes.map((node, index) => {
    const signal = nodeSignals[node.nodeID];
    const connectionStatus = signal ? getConnectionStatus(signal.rssi, signal.snr) : 'None';
    
    return (
      <Table.Tr key={`${node.nodeID}-${index}`}>
        <Table.Td>{node.name}</Table.Td>
        <Table.Td>{node.description || '—'}</Table.Td>
        <Table.Td>{node.status}</Table.Td>
        <Table.Td>{connectionStatus}</Table.Td>
        <Table.Td>{node.last_seen ? new Date(node.last_seen).toLocaleTimeString() : 'Never'}</Table.Td>
      </Table.Tr>
    );
  });

  // Table rows for readings
  const readingsRows = latestReadings.map((reading, index) => (
    <Table.Tr key={`${reading.readingID}-${index}`}>
      <Table.Td>{reading.readingID}</Table.Td>
      <Table.Td>{new Date(reading.timestamp).toLocaleTimeString()}</Table.Td>
      <Table.Td>{reading.nodeName}</Table.Td>
      <Table.Td>{reading.temperature ? `${reading.temperature.toFixed(1)} °C` : '—'}</Table.Td>
      <Table.Td>{reading.humidity ? `${reading.humidity.toFixed(1)}%` : '—'}</Table.Td>
      <Table.Td>{reading.co_level ? `${reading.co_level} ppm` : '—'}</Table.Td>
      <Table.Td>{reading.latitude ? reading.latitude.toFixed(4) : '—'}</Table.Td>
      <Table.Td>{reading.longitude ? reading.longitude.toFixed(4) : '—'}</Table.Td>
      <Table.Td>{reading.altitude ? `${reading.altitude.toFixed(1)}m` : '—'}</Table.Td>
    </Table.Tr>
  ));

  // Stats data with icons
  const statsData = [
    { title: 'Last Reading', value: stats.lastReading, Icon: null },
    { title: 'Temperature', value: stats.temperature, Icon: ThermometerIcon },
    { title: 'Humidity', value: stats.humidity, Icon: DropHalfIcon },
    { title: 'CO Level', value: stats.coLevel, Icon: TornadoIcon },
  ];

  return (
    <Box p="md">
      <Header title="Ranger's Dashboard" subtitle={`EcoGuardian System Overview • WebSocket: ${connectionStatus}`} />

      {/* Top Row - Nodes & Active Alerts */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="md">
        {/* Sensor Nodes Card - Dynamic Height */}
        <Card radius="lg" shadow="sm" p="lg">
          <Text tt="uppercase" c="dimmed" size="xs" fw="700" mb="sm">
            Sensor Nodes ({nodes.length})
          </Text>
          <Box style={{ 
            maxHeight: nodes.length > 0 ? `${Math.min(nodes.length * 45 + 60, 300)}px` : '120px', 
            overflow: 'auto' 
          }}>
            {nodes.length === 0 ? (
              <Text c="dimmed" size="sm" py="md">No sensor nodes available</Text>
            ) : (
              <Table size="sm">
                <Table.Thead style={{ 
                  position: 'sticky', 
                  top: 0, 
                  backgroundColor: 'var(--mantine-color-body)', 
                  zIndex: 1 
                }}>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Description</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Connection</Table.Th>
                    <Table.Th>Last Seen</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{nodesRows}</Table.Tbody>
              </Table>
            )}
          </Box>
        </Card>

        {/* ✅ Use ActiveAlerts Component */}
        <ActiveAlerts 
          activeAlerts={activeAlerts} 
          onResolve={handleResolveAlert}
          API={API}
        />
      </SimpleGrid>

      {/* Stats Row */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb="md">
        {statsData.map(({ title, value, Icon }) => (
          <Card key={title} radius="lg" shadow="sm" p="lg">
            <Box style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {Icon && (
                <Icon size={32} color="var(--mantine-color-teal-6)" />
              )}
              <Box>
                <Text tt="uppercase" c="dimmed" size="xs" fw="700">
                  {title}
                </Text>
                <Text size="lg" fw="700">
                  {value}
                </Text>
              </Box>
            </Box>
          </Card>
        ))}
      </SimpleGrid>

      {/* Latest Readings */}
      <SimpleGrid cols={{ base: 1 }} spacing="md">
        <Card radius="lg" shadow="sm" p="lg">
          <Text tt="uppercase" c="dimmed" size="xs" fw="700" mb="sm">
            Latest Environmental Readings
          </Text>
          <Box style={{ maxHeight: '300px', overflow: 'auto' }}>
            <Table size="sm">
              <Table.Thead style={{ 
                position: 'sticky',
                top: 0,
                backgroundColor: 'var(--mantine-color-body)',
                zIndex: 1,
              }}>
                <Table.Tr>
                  <Table.Th>ID</Table.Th>
                  <Table.Th>Timestamp</Table.Th>
                  <Table.Th>Node</Table.Th>
                  <Table.Th>Temperature</Table.Th>
                  <Table.Th>Humidity</Table.Th>
                  <Table.Th>CO Level</Table.Th>
                  <Table.Th>Latitude</Table.Th>
                  <Table.Th>Longitude</Table.Th>
                  <Table.Th>Altitude</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>{readingsRows}</Table.Tbody>
            </Table>
          </Box>
        </Card>
      </SimpleGrid>
    </Box>
  );
}