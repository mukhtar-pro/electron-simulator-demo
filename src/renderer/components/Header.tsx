import React from "react";

interface HeaderProps {
  onResetView: () => void;
  isOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onResetView, isOnline }) => {
  return (
    <header className="h-[60px] bg-gradient-to-r from-bg-secondary to-bg-tertiary border-b border-border flex justify-between items-center px-5 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-accent-highlight">⚙</span>
        <h1 className="text-lg font-semibold tracking-widest text-text-primary">
          EQUIPMENT MONITORING SYSTEM
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <button
          className="px-4 py-2 border border-border rounded bg-bg-card text-text-primary text-[13px] font-medium flex items-center gap-1.5 cursor-pointer transition-all duration-200 hover:bg-accent-primary hover:border-accent-secondary"
          onClick={onResetView}
        >
          <span>↺</span> Reset View
        </button>
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide ${
            isOnline
              ? "bg-status-good/10 border border-status-good text-status-good"
              : "bg-status-danger/10 border border-status-danger text-status-danger"
          }`}
        >
          <span className="pulse"></span>
          {isOnline ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
        </div>
      </div>
    </header>
  );
};
