// src/pages/AlertsPage.jsx
export default function AlertsPage({ alerts = [] }) {
    return (
      <div className="row g-3 mt-3">
        <div className="card p-3 sub_card">
          <p className="subcard_name text-muted">Alerts</p>
          <table className="table table-borderless table-hover">
            <thead>
              <tr>
                <th></th>
                <th>Threat Type</th>
                <th>Detected By</th>
                <th>Detected At</th>
                <th>Risk Level Reached</th>
                <th>Status</th>
                <th>Resolved At</th>
              </tr>
            </thead>
            <tbody>
              {alerts.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted">No alerts available</td></tr>
              ) : (
                  alerts.map((a) => (
                  <tr key={a.id}>
                    <td className="text-muted">{a.icon}</td>
                    <td className="text-muted">{a.type}</td>
                    <td className="text-muted">{a.node}</td>
                    <td className="text-muted">{a.date} {a.time}</td>
                    <td className="text-muted"></td>
                    <td className="text-muted"></td>
                    <td className="text-muted"></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  