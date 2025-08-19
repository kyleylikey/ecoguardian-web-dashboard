export default function ActiveAlerts({ alerts }) {
    return (
        <div>
            <h4 className="subcard_name text-dark">Active Alerts</h4>
            
            <p>{alerts.length}</p>
        </div>
    );
}
