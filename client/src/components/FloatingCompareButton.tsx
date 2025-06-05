import React from "react";
import { useNavigate } from "react-router-dom";
import { useCompare } from "../hooks/useCompare";
import "./FloatingCompareButton.css";

const FloatingCompareButton: React.FC = () => {
  const navigate = useNavigate();
  const { comparedLaptops, clearCompare } = useCompare();

  if (comparedLaptops.length < 2) {
    return null; // Only show when at least 2 laptops are selected
  }

  const handleCompareClick = () => {
    navigate("/compare");
  };

  return (
    <div className="floating-compare-button">
      <div className="compare-preview">
        <div className="compare-laptops">
          {comparedLaptops.map((laptop) => (
            <div key={laptop._id} className="compare-laptop-thumb">
              <img
                src={
                  laptop.specs?.details?.imageLinks?.[0] ||
                  "/placeholder-laptop.jpg"
                }
                alt={laptop.specs?.head}
                className="laptop-thumb-image"
              />
            </div>
          ))}
        </div>
        <div className="compare-actions">
          <button onClick={handleCompareClick} className="compare-btn">
            <span className="compare-icon">⚖️</span>
            Compare {comparedLaptops.length}
          </button>
          <button
            onClick={clearCompare}
            className="clear-btn"
            title="Clear all"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingCompareButton;
