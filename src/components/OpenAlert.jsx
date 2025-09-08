export default function OpenAlert({ show, onHide, alert }) {
  if (!show) return null;

  return (
    <div
      className={`modal fade show`}
      style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalCenterTitle"
      aria-hidden={!show}
    >
      <div className="modal-dialog modal-dialog-centered" role="document">
        <div className="modal-content">
          {/* Modal Header */}
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLongTitle">
              {alert?.type || "Alert"}
            </h5>
            <button
              type="button"
              className="close"
              onClick={onHide}
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="modal-body">
            <p><strong>Node:</strong> {alert?.node}</p>
            <p><strong>Date:</strong> {alert?.date}</p>
            <p><strong>Time:</strong> {alert?.time}</p>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>
              Close
            </button>
            <button type="button" className="btn btn-primary">
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
