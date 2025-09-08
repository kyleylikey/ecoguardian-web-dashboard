import { useState, useEffect } from "react";
import "./App.css";

// Components
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";
import NodesStatus from "./components/NodesStatus";
import LastData from "./components/LastData";
import ActiveAlerts from "./components/ActiveAlerts";
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

    // --- Readings API call ---
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/readings")
      .then((res) => res.json())
      .then((data) => setReadings(data.data))
      .catch((err) => console.error("❌ Error fetching readings:", err));
  }, []);

  // Pagination 
  const totalPages = Math.ceil(readings.length / rowsPerPage) || 1;
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentReadings = readings.slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="card p-3">
      <Topbar />

      <div className="container-fluid mt-3 p-0">
        <div className="row g-3">
          {/* -------------------- 1st Col -------------------- */}
          <div className="col-lg-2 d-flex flex-column">

            {/* Sidebar */}
            <div className="card p-3 mb-3 sub_card rounded">
              <Sidebar />
            </div>
            
          </div>
          {/* -------------------- 1st Col End -------------------- */}

          {/* -------------------- 2nd Col -------------------- */}
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

          </div>
          {/* -------------------- 2nd Col End -------------------- */}

          {/* -------------------- 3rd Col -------------------- */}
          <div className="col-lg-7 d-flex flex-column">

            {/* Alerts */}
            <div className="card p-3 mb-3 sub_card">
              <AlertsPanel alerts={alerts} />
            </div>

            {/* Environmental Readings */}
            <div className="card p-3 sub_card flex-grow-1 d-flex flex-column">
              <p className="subcard_name text-muted">Today's Environmental Readings</p>
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
                        <td className="text-muted">{r.nodeID}</td>
                        <td className="text-muted">{r.temperature}</td>
                        <td className="text-muted">{r.humidity}</td>
                        <td className="text-muted">{r.co_level}</td>
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
          {/* -------------------- 3rd Col End -------------------- */}

        </div>
      </div>
    </div>
  );
}

export default App;
