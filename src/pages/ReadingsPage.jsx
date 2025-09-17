// src/pages/EnvironmentalReadingsPage.jsx
import { useState, useEffect } from "react";

export default function EnvironmentalReadingsPage({ readings = [], rowsPerPage = 14 }) {
  const [currentPage, setCurrentPage] = useState(1);

  // reset to page 1 when readings change / component mounts
  useEffect(() => {
    setCurrentPage(1);
  }, [readings]);

  const totalPages = Math.max(1, Math.ceil((readings?.length || 0) / rowsPerPage));
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentReadings = (readings || []).slice(startIndex, startIndex + rowsPerPage);

  return (
    <div className="row g-3 mt-3">
    <div className="card p-3 sub_card flex-grow-1 d-flex flex-column">
      <p className="subcard_name text-muted">Environmental Readings</p>

      <div className="table-responsive flex-grow-1 overflow-auto rounded">
        <table className="table table-borderless table-hover">
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
            {currentReadings.length === 0 ? (
              <tr><td colSpan={5} className="text-center text-muted">No readings available</td></tr>
            ) : (
              currentReadings.map((r, idx) => (
                <tr key={startIndex + idx}>
                  <td className="text-muted">{new Date(r.timestamp).toDateString()} {new Date(r.timestamp).toLocaleTimeString()}</td>
                  <td className="text-muted">{r.nodeID}</td>
                  <td className="text-muted">{r.temperature}</td>
                  <td className="text-muted">{r.humidity}</td>
                  <td className="text-muted">{r.co_level}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-center mt-3">
        <button className="btn me-2 readings_btns" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>
          &larr;
        </button>
        <span>{currentPage} / {totalPages}</span>
        <button className="btn ms-2 readings_btns" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>
          &rarr;
        </button>
      </div>
    </div>
    </div>
  );
}
