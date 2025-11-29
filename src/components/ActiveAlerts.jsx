import { Box, Card, Text, Title, Badge, Table, Indicator } from '@mantine/core';
import { modals } from '@mantine/modals';
import { FireIcon, TreeIcon, PawPrintIcon, CheckIcon } from "@phosphor-icons/react";

export function ActiveAlerts({ activeAlerts, onResolve, API }) {
  // Alert configs with proper theme colors
  const alertConfigs = {
    "Wildfire Risk": { 
      color: "alert-red", 
      bg: "alert-red.2", 
      textColor: "alert-red.9",
      subtextColor: "alert-red.8",
      iconColor: "#e03131",
      icon: FireIcon
    },
    "Illegal Logging": { 
      color: "chocolate-plum", 
      bg: "chocolate-plum.2", 
      textColor: "chocolate-plum.9",
      subtextColor: "chocolate-plum.8",
      iconColor: "var(--mantine-color-chocolate-plum-9)",
      icon: TreeIcon 
    },
    "Poaching": { 
      color: "verdigris", 
      bg: "verdigris.2", 
      textColor: "verdigris.9",
      subtextColor: "verdigris.8",
      iconColor: "var(--mantine-color-verdigris-9)",
      icon: PawPrintIcon 
    }
  };

  const formatConfidence = (c) => {
    if (c === null || c === undefined) return "N/A";
    const n = Number(c);
    return !isNaN(n) && n <= 1 ? `${(n * 100).toFixed(1)}%` : String(c);
  };

  const calculateElapsedTime = (timestamp) => {
    const alertTime = new Date(timestamp).getTime();
    const now = Date.now();
    const diff = Math.floor((now - alertTime) / 1000);
    
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${seconds}s`;
    }
  };

  const openAlertModal = async (alert) => {
    const config = alertConfigs[alert.type] || alertConfigs["Wildfire Risk"];
    const elapsed = calculateElapsedTime(alert.timestamp);

    // Fetch incident data for fire alerts
    let incidentData = [];
    if (alert.risk_type === "fire") {
      try {
        const res = await fetch(
          `${API}/api/risks/incidents/fire/${encodeURIComponent(alert.incidentTimestamp)}?nodeID=${alert.nodeID}`
        );
        
        if (res.ok) {
          const json = await res.json();
          incidentData = (json?.alerts || []).map(a => ({
            timestamp: a.updated_at,
            temperature: a.temperature,
            humidity: a.humidity,
            co_level: a.co_level,
            fire_risklvl: a.fire_risklvl,
          }));
        }
      } catch (err) {
        console.error("Error fetching fire incident:", err);
      }
    }

    const incidentRows = incidentData.map((reading, index) => {
      const severity = reading.fire_risklvl === "high" ? "High" :
                      reading.fire_risklvl === "medium" ? "Moderate" : "Low";
      return (
        <Table.Tr key={index}>
          <Table.Td>{new Date(reading.timestamp).toLocaleTimeString()}</Table.Td>
          <Table.Td>{reading.temperature?.toFixed(1) ?? "—"}</Table.Td>
          <Table.Td>{reading.humidity?.toFixed(1) ?? "—"}</Table.Td>
          <Table.Td>{reading.co_level ?? "—"}</Table.Td>
          <Table.Td>
            <Badge 
              color={severity === "High" ? "red" : severity === "Moderate" ? "orange" : "yellow"}
              variant="filled"
              size="sm"
            >
              {severity}
            </Badge>
          </Table.Td>
        </Table.Tr>
      );
    });

    modals.openConfirmModal({
      title: (
        <Box style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '1rem', marginTop: '0.8rem' }}>
          <Title order={4} c={config.textColor}>
            {alert.type}
          </Title>
          <Badge 
            color={config.color}
            variant="filled" 
            size="lg"
          >
            Time Elapsed: {elapsed}
          </Badge>
        </Box>
      ),
      size: alert.type === "Wildfire Risk" ? "xl" : "lg",
      centered: true,
      children: (
        <Box mt="md">
          {/* Alert details */}
          <Text mb="sm" fw="600">
            Detected By: <Text span ms="sm" fw="400">{alert.node}</Text>
          </Text>
          <Text mb="sm" fw="600">
            Detected At: <Text span ms="sm" fw="400">{new Date(alert.timestamp).toLocaleString()}</Text>
          </Text>
          
          {alert.confidence && (
            <Text mb="sm" fw="600">
              Confidence: <Text span ms="sm" fw="400">{formatConfidence(alert.confidence)}</Text>
            </Text>
          )}

          {/* Show initial readings for fire alerts */}
          {alert.risk_type === "fire" && (
            <>
              {alert.temperature != null && (
                <Text mb="sm" fw="600">
                  Initial Temperature: <Text span ms="sm" fw="400">{alert.temperature.toFixed(1)}°C</Text>
                </Text>
              )}
              {alert.humidity != null && (
                <Text mb="sm" fw="600">
                  Initial Humidity: <Text span ms="sm" fw="400">{alert.humidity.toFixed(1)}%</Text>
                </Text>
              )}
              {alert.co_level != null && (
                <Text mb="sm" fw="600">
                  Initial CO Level: <Text span ms="sm" fw="400">{alert.co_level} ppm</Text>
                </Text>
              )}
            </>
          )}

          {/* Fire incident timeline */}
          {alert.type === "Wildfire Risk" && incidentData.length > 0 && (
            <Box mt="lg">
              <Text mb="md" fw="600">
                Fire Incident Timeline ({incidentData.length} alerts):
              </Text>
              <Box style={{ maxHeight: '250px', overflow: 'auto' }}>
                <Table size="sm">
                  <Table.Thead style={{ 
                    position: 'sticky', 
                    top: 0, 
                    backgroundColor: 'var(--mantine-color-body)', 
                    zIndex: 1 
                  }}>
                    <Table.Tr>
                      <Table.Th>Timestamp</Table.Th>
                      <Table.Th>Temperature</Table.Th>
                      <Table.Th>Humidity</Table.Th>
                      <Table.Th>CO Level</Table.Th>
                      <Table.Th>Severity</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{incidentRows}</Table.Tbody>
                </Table>
              </Box>
            </Box>
          )}
        </Box>
      ),
      labels: { 
        confirm: 'Resolve Alert', 
        cancel: 'Close' 
      },
      confirmProps: { 
        color: config.color,
        leftSection: <CheckIcon size={16} weight="bold" />
      },
      cancelProps: {
        color: 'gray',
        variant: 'subtle'
      },
      onCancel: () => {
        console.log('Modal closed');
      },
      onConfirm: async () => {
        console.log('Resolving alert:', alert.id);
        
        try {
          // ✅ Use the correct API endpoint like in MUI version
          const res = await fetch(`${API}/api/risks/${alert.id}/resolve`, { 
            method: "PATCH" 
          });
          
          if (!res.ok) {
            console.error("Failed to resolve risk:", await res.text());
            return;
          }

          console.log("✅ Alert resolved successfully");
          
          // ✅ Call the parent's onResolve to update state
          if (onResolve) {
            await onResolve(alert);
          }
        } catch (err) {
          console.error("❌ Error resolving alert:", err);
        }
      },
    });
  };

  return (
    <Card radius="lg" shadow="sm" p="lg">
      <Text tt="uppercase" c="dimmed" size="xs" fw="700">
        Active Alerts ({activeAlerts.length})
      </Text>

      {/* Alert cards container with dynamic height */}
      <Box 
        pt="lg"
        style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          overflowX: 'auto', 
          overflowY: 'visible', 
          paddingTop: '0.23rem', 
          paddingBottom: '0.5rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          minHeight: activeAlerts.length > 0 ? '140px' : '80px',
          height: "fit-content",
          position: 'relative',
        }} 
        sx={{ 
          '&::-webkit-scrollbar': { display: 'none' },
          '&::after': activeAlerts.length > 1 ? {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '60px',
            background: 'linear-gradient(to right, transparent, var(--mantine-color-body))',
            pointerEvents: 'none',
          } : {}
        }}
      >
        {activeAlerts.length === 0 ? (
          <Text c="dimmed" size="sm" py="md">No active alerts</Text>
        ) : (
          activeAlerts.map((alert) => {
            const config = alertConfigs[alert.type] || alertConfigs["Wildfire Risk"];
            
            return (
              <Box 
                key={`${alert.risk_type}-${alert.nodeID}-${alert.incidentTimestamp}`} 
                style={{ 
                  display: 'inline-block', 
                  width: 'fit-content', 
                  flexShrink: 0
                }}
              >
                <Indicator color={config.color} size={20} withBorder processing>
                  <Card 
                    bg={config.bg}
                    radius="lg" 
                    shadow="sm" 
                    p="md" 
                    style={{ 
                      cursor: 'pointer', 
                      transition: 'transform 0.2s', 
                      width: '200px',
                      height: '120px'
                    }}
                    onClick={() => openAlertModal(alert)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <Box style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '1.2rem',
                      height: '100%',
                      justifyContent: 'space-between'
                    }}>
                      {/* Alert header with icon */}
                      <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <config.icon size={22} color={config.iconColor} weight="duotone" />
                        <Title order={5} c={config.textColor}>{alert.type}</Title>
                      </Box>

                      {/* Alert details */}
                      <Box>
                        <Text size="xs" c={config.subtextColor} mb="0.3rem">
                          Detected by {alert.node}
                        </Text>
                        <Text size="xs" c={config.subtextColor}>
                          {new Date(alert.timestamp).toLocaleString()}
                        </Text>
                        {alert.risk_type === "fire" && alert.cooldown_counter > 0 && (
                          <Text size="xs" c={config.subtextColor} fw={600} mt="0.3rem">
                            Cooldown: {alert.cooldown_counter}/5
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Card>
                </Indicator>
              </Box>
            );
          })
        )}
      </Box>
    </Card>
  );
}