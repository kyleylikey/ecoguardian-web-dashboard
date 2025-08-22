import { useState } from "react";
import "./App.css";

// Components
import Topbar from "./components/Topbar";
import NodesStatus from "./components/NodesStatus";
import LastData from "./components/LastData";
import ActiveAlerts from "./components/ActiveAlerts";
import Export from "./components/Export";
import AlertsPanel from "./components/AlertsPanel";
// import ReadingsTable from "./components/ReadingsTable";

function App() {
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 7;

  let nodes = [
    { id: 1, name: "Node 1", active: true },
    { id: 2, name: "Node 2", active: false },
    { id: 3, name: "Node 3", active: true },
    { id: 4, name: "Node 4", active: false },
    { id: 5, name: "Node 5", active: false },
    { id: 6, name: "Node 6", active: false }
  ];

  let alerts = [
    {
      id: 1,
      type: "Wildfire Risk",
      node: "Node 1",
      date: "Fri, 4 Jul 2025",
      time: "11:03:43 AM",
    },
    {
      id: 2,
      type: "Illegal Logging",
      node: "Node 2",
      date: "Fri, 4 Aug 2025",
      time: "11:03:43 AM",
    },
    {
      id: 3,
      type: "Poaching",
      node: "Node 1",
      date: "Fri, 4 Aug 2025",
      time: "11:03:43 AM",
    },
    {
      id: 5,
      type: "Wildfire Risk",
      node: "Node 1",
      date: "Fri, 4 Jul 2025",
      time: "11:03:43 AM",
    },
    {
      id: 6,
      type: "Wildfire Risk",
      node: "Node 1",
      date: "Fri, 4 Jul 2025",
      time: "11:03:43 AM",
    },
    {
      id: 7,
      type: "Illegal Logging",
      node: "Node 2",
      date: "Fri, 4 Aug 2025",
      time: "11:03:43 AM",
    },
  ];

  let readings = [
    {
      timestamp: "Fri, 22 Aug 2025 8:02:00 AM",
      sensorId: "Node 1",
      temperature: 36,
      humidity: 30,
      coLevel: 48,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 2",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
    {
      timestamp: "Fri, 4 Jul 2025 10:58:11 AM",
      sensorId: "Node 1",
      temperature: 30,
      humidity: 81,
      coLevel: 0.1,
    },
  ];

  // Pagination 
  const totalPages = Math.ceil(readings.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentReadings = readings.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="card p-3">
      <Topbar />

      <div className="container-fluid mt-3 p-0">
        <div className="row g-3">
          {/* -------------------- Left Col -------------------- */}
          <div className="col-lg-3 d-flex flex-column">

            {/* Nodes Status */}
            <div className="card p-3 mb-3 sub_card rounded">
              <NodesStatus nodes={nodes} />
            </div>
            {/* Last Data Received */}
            <div className="card p-3 mb-3 sub_card rounded">
              <LastData readings={readings} />
            </div>
            {/* Environmental Readings */}
            <div className="card p-3 mb-3 sub_card rounded">
              <ActiveAlerts alerts={alerts} />
            </div>

            {/* Export */}
            <div className="mt-auto">
              <div className="card p-3 export_card">
                <Export />
              </div>
            </div>
          </div>
          {/* -------------------- Left Col End -------------------- */}

          {/* -------------------- Right Col -------------------- */}
          <div className="col-lg-9 d-flex flex-column">

            {/* Alerts */}
            <div className="card p-3 mb-3 sub_card">
              <AlertsPanel alerts={alerts} />
            </div>

            {/* Environmental Readings */}
            <div className="card p-3 sub_card flex-grow-1 d-flex flex-column">
              <h4 className="subcard_name text-dark">Environmental Readings</h4>
              <div className="table-responsive flex-grow-1 rounded">
                <table className="table table-boderless table-hover">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Sensor ID</th>
                      <th>Temperature (°C)</th>
                      <th>Humidity (%)</th>
                      <th>CO Level (ppm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentReadings.map((r, index) => (
                      <tr key={index}>
                        <td className="text-muted">{r.timestamp}</td>
                        <td className="text-muted">{r.sensorId}</td>
                        <td className="text-muted">{r.temperature}</td>
                        <td className="text-muted">{r.humidity}</td>
                        <td className="text-muted">{r.coLevel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="d-flex justify-content-center mt-3">
                <button
                  className="btn me-2 readings_btns"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  &larr;
                </button>
                <span>
                  {currentPage} / {totalPages}
                </span>
                <button
                  className="btn ms-2 readings_btns"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  &rarr;
                </button>
              </div>
            </div>
          </div>
          {/* -------------------- Right Col End -------------------- */}

        </div>
      </div>
    </div>
  );
}

export default App;
