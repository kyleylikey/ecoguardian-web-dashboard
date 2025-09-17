import { useEffect, useRef } from "react";

export default function NodesStatus({ nodes }) {
 const scrollRef = useRef(null);

 useEffect(() => {
   const slider = scrollRef.current;
   if (!slider) return;

   let isDown = false;
   let startY;
   let scrollTopSaved;

   const handleMouseDown = (e) => {
     isDown = true;
     slider.classList.add("active");
     startY = e.pageY - slider.offsetTop;
     scrollTopSaved = slider.scrollTop;
   };

   const handleMouseLeave = () => {
     isDown = false;
     slider.classList.remove("active");
   };

   const handleMouseUp = () => {
     isDown = false;
     slider.classList.remove("active");
   };

   const handleMouseMove = (e) => {
     if (!isDown) return;
     e.preventDefault();
     const y = e.pageY - slider.offsetTop;
     const walk = (y - startY) * 1.5; // scroll speed multiplier
     slider.scrollTop = scrollTopSaved - walk;
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
     <div className="nodes-list list-group" ref={scrollRef}>
       {nodes.map((n) => (
         <li
           key={n.id}
           className={`list-group-item d-flex justify-content-between align-items-center ${
             n.active ? "active_node" : "list-group-item-light"
           }`}
         >
           {n.name}
           <span>{n.active ? "🟢 Active" : "🔴 Inactive"}</span>
         </li>
       ))}
     </div>
   </>
 );
}
