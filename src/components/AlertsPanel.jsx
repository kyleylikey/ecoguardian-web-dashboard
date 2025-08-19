export default function AlertsPanel() {
    return (
    <div>
      <h4 className="subcard_name">Alert Panel</h4>
        
      {alerts.map((alert) => (
        <div key={alert.id} className="p-3 bg-white rounded mb-2">
          <strong>{alert.type}</strong>{" "}
          <span className="text-muted">{alert.node}</span>
          <br />
          {alert.date}
          <br />
          {alert.time}
        </div>
      ))}
    </div>
  );
}