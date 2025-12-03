import React from "react";

interface HeaderProps {
  onResetView: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onResetView, isOnline }) => {
  return (
    <header className="app-header">
      <div className="header-title">
        <span className="icon">⚙</span>
        <h1>EQUIPMENT MONITORING SYSTEM</h1>
      </div>
      <div className="header-controls">
        <button className="btn btn-secondary" onClick={onResetView}>
          <span>↺</span> Reset View
        </button>
        <div className={`status-badge ${isOnline ? "operational" : "offline"}`}>
          <span className="pulse"></span>
          {isOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </div>
      </div>
    </header>
  );
};
