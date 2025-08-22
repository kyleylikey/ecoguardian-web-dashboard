import { useEffect, useRef } from "react";

export default function NodesStatus({ nodes }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const slider = scrollRef.current;
    if (!slider) return; // guard in case ref is null

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
    <div>
      <p className="subcard_name text-dark">Nodes Status</p>

      {/* Added ref here */}
      <div className="nodes-list" ref={scrollRef}>
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
