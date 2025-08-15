import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="card p-3">

      {/* top bar */}
      <div className="topbar d-flex justify-content-between">
        <div>EcoGuardian</div>
        <div>
          <span className="me-3">
            System: <span className="text-success">Up</span>
          </span>
          <span>Uptime: 03h08m06s</span>
        </div>
      </div>

      <div className="container-fluid mt-3">
        <div className="row g-3">

          {/* left col */}
          <div className="col-lg-3">

            {/* Nodes Status */}
            <div className="card p-3 mb-3">
              <h5>Nodes Status</h5>
              <p>All nodes are active</p>
              <p><span className="status-dot"></span>Node 1</p>
              <p><span className="status-dot"></span>Node 2</p>
            </div>

            {/* last data received */}
            <div className="card p-3 mb-3">
              <h6>Last Data Received</h6>
              <p><em>10:20:13 AM</em></p>
            </div>

            {/* active alerts */}
            <div className="card p-3 mb-3">
              <h6>Active Alerts</h6>
              <p>1</p>
            </div>

            {/* export log */}
            <div className="card p-3 text-center">
              <h6>Export Log</h6>
              <button className="btn btn-light">
                <i className="bi bi-download"></i> Download
              </button>
            </div>
          </div>

          {/* right col */}
          <div className="col-lg-9">
            
            {/* Alert Panel */}
            <div className="card p-3 mb-3">
              <h5>Alert Panel</h5>
              <div className="p-3 bg-white rounded">
                <strong>Wildfire Risk</strong> <span className="text-muted">Node 1</span><br />
                Fri, 4 Jul 2025<br />
                11:03:43 AM
              </div>
            </div>

            {/* environmental readings */}
            <div className="card p-3">
              <h5>Environmental Readings</h5>
              <div className="table-responsive">
                <table className="table table-borderless">
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
                    <tr>
                      <td>Fri, 4 Jul 2025 11:03:43 AM</td>
                      <td>Node 1</td>
                      <td>36</td>
                      <td>30</td>
                      <td>48</td>
                    </tr>
                    <tr>
                      <td>Fri, 4 Jul 2025 10:58:11 AM</td>
                      <td>Node 2</td>
                      <td>30</td>
                      <td>81</td>
                      <td>0.1</td>
                    </tr>
                    <tr>
                      <td>Fri, 4 Jul 2025 10:58:11 AM</td>
                      <td>Node 1</td>
                      <td>30</td>
                      <td>81</td>
                      <td>0.1</td>
                    </tr>
                    <tr>
                      <td>Fri, 4 Jul 2025 10:58:11 AM</td>
                      <td>Node 2</td>
                      <td>30</td>
                      <td>81</td>
                      <td>0.1</td>
                    </tr>
                    <tr>
                      <td>Fri, 4 Jul 2025 10:58:11 AM</td>
                      <td>Node 1</td>
                      <td>30</td>
                      <td>81</td>
                      <td>0.1</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-center">
                <button className="btn btn-light me-2">&larr;</button>
                <span>1</span>
                <button className="btn btn-light ms-2">&rarr;</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default App;
