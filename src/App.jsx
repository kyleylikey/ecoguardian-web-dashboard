// src/App.jsx
import { useState, useEffect } from "react";
import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";

// Components
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import NodesStatus from "./components/NodesStatus";
import LastData from "./components/LastData";
import ActiveAlerts from "./components/ActiveAlerts";
import AlertsPanel from "./components/AlertsPanel";
import ReadingsPanel from "./components/ReadingsPanel";

// Pages
import AlertsPage from "./Pages/AlertsPage";
import EnvironmentalReadingsPage from "./pages/ReadingsPage";

function App() {
  const [selectedPage, setSelectedPage] = useState("dashboard"); //dashboard | alerts | readings
  const rowsPerPage = 7;

  const nodes = [
    { id: 1, name: "Node 1", active: true },
    { id: 2, name: "Node 2", active: false },
    { id: 3, name: "Node 3", active: false },
    { id: 4, name: "Node 4", active: true },
    { id: 5, name: "Node 5", active: true },
    { id: 6, name: "Node 6", active: false },
    { id: 7, name: "Node 7", active: true },
  ];

  // readings first
  const [readings, setReadings] = useState([]);
  useEffect(() => {
    fetch("http://localhost:3000/api/readings")
      .then((res) => res.json())
      .then((data) => setReadings(data.data || []))
      .catch((err) => console.error("❌ Error fetching readings:", err));
  }, []);

  // then alerts
  const [alerts, setAlerts] = useState([]);

  const checkWildfireRisk = (reading) => {
    return (
      reading.temperature > 30 &&
      reading.humidity < 60 &&
      reading.co_level > 10
    );
  };

  useEffect(() => {
    if (!readings || readings.length === 0) return;

    const generatedAlerts = readings
      .filter(checkWildfireRisk)
      .map((r, index) => ({
        id: index + 1,
        icon: "🔥",
        type: "Wildfire Risk",
        node: `Node ${r.nodeID}`,
        date: new Date(r.timestamp).toDateString(),
        time: new Date(r.timestamp).toLocaleTimeString(),
      }));

    setAlerts(generatedAlerts);
  }, [readings]);

  return (
    <div className="container-fluid p-0">
      <Topbar />

      <div className="row no-gutters">
        <Sidebar selectedPage={selectedPage} onSelect={setSelectedPage} />

        <main className="col-md-9 ms-sm-auto col-lg-10 px-md-4 offset-md-2">
          {/* state-based page switch */}
          {selectedPage === "dashboard" && (
            <div className="row g-3 mt-3">
              <div className="col-lg-3 d-flex flex-column">
                <div className="card p-3 mb-3 sub_card">
                  <p className="subcard_name text-muted mb-2">Sensor Nodes Status</p>
                  <NodesStatus nodes={nodes} />
                </div>
                <div className="card p-3 mb-3 sub_card">
                  <p className="subcard_name text-muted mb-2">Last Data Reading</p>
                  <LastData readings={readings} />
                </div>
                <div className="card p-3 sub_card flex-grow-1 d-flex flex-column">
                  <p className="subcard_name text-muted mb-2">Active Alerts</p>
                  <ActiveAlerts alerts={alerts} />
                </div>
              </div>

              <div className="col-lg-9 d-flex flex-column">
                <div className="card p-3 mb-3 sub_card">
                  <p className="subcard_name text-muted mb-2">New Alerts</p>
                  <AlertsPanel alerts={alerts} />
                </div>

                <div className="card p-3 mb-3 sub_card">
                  <p className="subcard_name text-muted mb-2">Environmental Readings</p>
                  <ReadingsPanel readings={readings} />
                </div>
              </div>

            </div>
          )}

          {selectedPage === "alerts" && <AlertsPage alerts={alerts} />}

          {selectedPage === "readings" && (
            <EnvironmentalReadingsPage readings={readings} rowsPerPage={rowsPerPage} />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
