export default function Sidebar({ selectedPage, onSelect }) {
  return (
    <nav className="col-md-2 col-lg-2 d-none d-md-flex flex-column bg-light sidebar position-fixed p-3 m-0">
      <div className="flex-grow-1">
        <button
          className={`btn w-100 text-start mb-1 ${selectedPage === "dashboard" ? "sidebar_active" : "text-secondary sidebar_inactive"}`}
          onClick={() => onSelect("dashboard")}
        >
          Ranger's Dashboard
        </button>

        <button
          className={`btn w-100 text-start mb-1 ${selectedPage === "alerts" ? "sidebar_active" : "text-secondary sidebar_inactive"}`}
          onClick={() => onSelect("alerts")}
        >
          Alerts
        </button>

        <button
          className={`btn w-100 text-start ${selectedPage === "readings" ? "sidebar_active" : "text-secondary sidebar_inactive"}`}
          onClick={() => onSelect("readings")}
        >
          Environmental Readings
        </button>
      </div>
 
      {/* Export section at bottom */}
      <div className="mt-auto">
        <button className="btn btn-outline-secondary w-100 export-btn">
          Export PDF
        </button>
      </div>
    </nav>
  );
}
