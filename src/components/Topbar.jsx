export default function Topbar() {
  return (
    <nav className="navbar sticky-top flex-md-nowrap p-2 shadow bg-light">
      <a className="navbar-brand col-md-2 col-lg-2 me-0 px-3 topbar_title" href="#">
        🌲 EcoGuardian
      </a>
      <div className="navbar-nav ms-auto">
        <div className="nav-item text-nowrap">
          <p className="nav-link px-3 mb-0 text-secondary"> System:  Uptime: </p>
        </div>
      </div>
    </nav>
  );
 }