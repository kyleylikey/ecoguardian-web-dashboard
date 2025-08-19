export default function NodesStatus({ nodes }) {
  return (
    <div>
      <h4 className="subcard_name text-dark">Nodes Status</h4>
      
      <div className="nodes-list">
        {nodes.map((node) => (
          <div
            key={node.id}
            className="p-2 bg-white rounded mb-2 d-flex align-items-center justify-content-between"
          >
            <strong className="me-2 text-muted">{node.name}</strong>

            <span className="d-flex align-items-center">
              <span
                className={`status-dot me-2 ${node.active ? "bg-success" : "bg-danger"}`}
              ></span>
              <span className={node.active ? "text-success" : "text-danger"}>
                {node.active ? "Active" : "Inactive"}
              </span>
            </span>
          </div>

        ))}
      </div>
    </div>
  );
}
