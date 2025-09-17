import { useEffect, useRef, useState } from "react";
import OpenAlert from "./OpenAlert";

export default function AlertsPanel({ alerts }) {
 const scrollRef = useRef(null);
 const [modalShow, setModalShow] = useState(false);
 const [selectedAlert, setSelectedAlert] = useState(null);
 const isDraggingRef = useRef(false);

 useEffect(() => {
   const slider = scrollRef.current;
   if (!slider) return;

   let isDown = false;
   let startX, scrollLeft;

   const handleMouseDown = (e) => {
     isDown = true;
     isDraggingRef.current = false;
     slider.classList.add("active");
     startX = e.pageX - slider.offsetLeft;
     scrollLeft = slider.scrollLeft;
   };

   const handleMouseLeave = () => {
     isDown = false;
     slider.classList.remove("active");
   };

   const handleMouseUp = () => {
     isDown = false;
     slider.classList.remove("active");
     setTimeout(() => {
       isDraggingRef.current = false;
     }, 0);
   };

   const handleMouseMove = (e) => {
     if (!isDown) return;
     e.preventDefault();
     const x = e.pageX - slider.offsetLeft;
     const walk = (x - startX) * 1.5;

     if (Math.abs(walk) > 5) {
       isDraggingRef.current = true;
     }

     slider.scrollLeft = scrollLeft - walk;
   };

   slider.addEventListener("mousedown", handleMouseDown);
   slider.addEventListener("mouseleave", handleMouseLeave);
   slider.addEventListener("mouseup", handleMouseUp);
   slider.addEventListener("mousemove", handleMouseMove);

   return () => {
     slider.removeEventListener("mousedown", handleMouseDown);
     slider.removeEventListener("mouseleave", handleMouseLeave);
     slider.removeEventListener("mouseup", handleMouseUp);
     slider.removeEventListener("mousemove", handleMouseMove);
   };
 }, []);

 return (
   <>
     <div className="alerts-list" ref={scrollRef}>
       {alerts.map((alert) => {
         let alertClass = "";
         let icon = "";

         if (alert.type === "Wildfire Risk") {
           alertClass = "alert-red";
         } else if (alert.type === "Illegal Logging") {
           alertClass = "alert-yellow";
         } else if (alert.type === "Poaching") {
           alertClass = "alert-yellow";
         }

         return (
           <div
             key={alert.id}
             className={`alert_card p-3 rounded mb-2 ${alertClass}`}
             onClick={() => {
               if (!isDraggingRef.current) {
                 setSelectedAlert(alert);
                 setModalShow(true);
               }
             }}
           >
             <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center">
               <strong>{alert.icon} {alert.type}</strong>
               <span className="text-muted">{alert.node}</span>
             </div>

             <small className="text-muted d-block mt-1">
               {alert.date} {alert.time}
             </small>
           </div>
         );
       })}
     </div>

     {selectedAlert && (
       <OpenAlert
         show={modalShow}
         onHide={() => setModalShow(false)}
         alert={selectedAlert}
       />
     )}
   </>
 );
}