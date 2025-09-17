export default function ActiveAlerts({ alerts }) {
  return (
    <ul className="flex-grow-1 overflow-auto p-0">
      <p className="fst-italic">{alerts.length}</p>
    </ul>
  );
}