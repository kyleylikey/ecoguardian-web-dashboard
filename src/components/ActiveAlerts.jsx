export default function ActiveAlerts({ alerts }) {
    return (
        <div>
            <p className="subcard_name text-dark">Active Alerts</p>
            
            <p className="text-muted fw-semibold fst-italic">{alerts.length}</p>
        </div>
    );
}
