export default function Topbar() {
    return (
    <div className="topbar d-flex flex-column flex-sm-row justify-content-between align-items-sm-center rounded">
      <div className="h5 m-0 title mb-2 mb-sm-0 text-light">EcoGuardian</div>

      <div className="bg-light px-3 py-2 rounded">
        <span className="me-3 text-muted">
          System: <span className="text-success">Up</span>
        </span>
        <span className="text-muted">Uptime: 03h08m06s</span>
      </div>

    </div>
  );
}