import { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";

export default function OpenAlert({ show, onHide, alert }) {
 const [elapsed, setElapsed] = useState("00");

 useEffect(() => {
   if (!alert) return;

   const alertTime = new Date(`${alert.date} ${alert.time}`).getTime();

   const timer = setInterval(() => {
     const now = Date.now();
     const diff = Math.floor((now - alertTime) / 1000);

     const hours = Math.floor(diff / 3600);
     const minutes = Math.floor((diff % 3600) / 60);
     const seconds = diff % 60;

     let formatted;
     if (hours > 0) {
       formatted =
         String(hours).padStart(2, "0") +
         ":" +
         String(minutes).padStart(2, "0") +
         ":" +
         String(seconds).padStart(2, "0");
     } else if (minutes > 0) {
       formatted =
         String(minutes).padStart(2, "0") +
         ":" +
         String(seconds).padStart(2, "0");
     } else {
       formatted = String(seconds).padStart(2, "0");
     }

     setElapsed(formatted);
   }, 1000);

   return () => clearInterval(timer);
 }, [alert]);

 if (!alert) return null;

 let headerClass = "bg-secondary text-white";
 let icon = "⚠️";

 if (alert.type === "Wildfire Risk") {
   headerClass = "bg-danger text-white";
   icon = "🔥";
 } else if (alert.type === "Illegal Logging") {
   headerClass = "bg-warning text-dark";
   icon = "🌲";
 } else if (alert.type === "Poaching") {
   headerClass = "bg-warning text-dark";
   icon = "🐾";
 }

 return (
   <Modal show={show} onHide={onHide} centered>
     <Modal.Header closeButton className={headerClass}>
       <Modal.Title>
         {icon} {alert.type}
       </Modal.Title>
     </Modal.Header>
     <Modal.Body>
       <p>
         <strong>Node:</strong> {alert.node}
       </p>
       <p>
         <strong>Detected at:</strong> {alert.date} {alert.time}
       </p>
       <p>
         <strong>Elapsed time:</strong> {elapsed}
       </p>
     </Modal.Body>
     <Modal.Footer>
       <Button variant="secondary" onClick={onHide}>
         Close
       </Button>
       <Button variant="primary">Resolve</Button>
     </Modal.Footer>
   </Modal>
 );
}