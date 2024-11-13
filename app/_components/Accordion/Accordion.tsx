import React, { useState } from "react";
import "./Accordion.css"; // Import some basic CSS styles

// Accordion Component
const Accordion = ({ title, content }: { title: string; content: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const contentRef = React.useRef<HTMLDivElement | null>(null); // Ref to measure content height

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="accordion">
      <div
        className={`accordion-header ${isOpen ? "open" : ""}`}
        onClick={toggleAccordion}
      >
        <h3>{title}</h3>
        <span>{isOpen ? "-" : "+"}</span>
      </div>
      <div
        className="accordion-content"
        style={{
          maxHeight: isOpen
            ? `${contentRef.current && contentRef.current.scrollHeight}px`
            : "0px",
          opacity: isOpen ? 1 : 0,
        }}
        ref={contentRef}
      >
        <div className="accordion-content-inner">{content}</div>
      </div>{" "}
    </div>
  );
};

export default Accordion;
