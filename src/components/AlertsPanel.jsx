import { useEffect, useRef } from "react";

export default function AlertsPanel({ alerts }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return; // guard in case ref is null

    let isDown = false;
    let startX;
    let scrollLeft;

    const handleMouseDown = (e) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const handleMouseLeave = () => { isDown = false; };
    const handleMouseUp = () => { isDown = false; };
    const handleMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5; // scroll speed multiplier
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

  // return the JSX, and attach ref
  return (
    <div className="alerts-list" ref={scrollRef}>
      {alerts.map((alert) => {
        let alertClass = "";
        if (alert.type === "Wildfire Risk") {
          alertClass = "alert-red";
        } else if (alert.type === "Illegal Logging" || alert.type === "Poaching") {
          alertClass = "alert-yellow";
        }

        return (
          <div
            key={alert.id}
            className={`alert_card p-3 rounded mb-2 ${alertClass}`}
          >
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center">
              <strong>{alert.type}</strong>{" "}
              <span className="text-muted">{alert.node}</span>
            </div>
            
            <br />
            {alert.date}
            <br />
            {alert.time}
          </div>
        );
      })}
    </div>
  );
}
