import React from "react";

export const Header: React.FC = () => {
  return (
    <header className="h-[60px] bg-gradient-to-r from-bg-secondary to-bg-tertiary border-b border-border flex justify-between items-center px-5 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-2xl text-accent-highlight">⚙</span>
        <h1 className="text-lg font-semibold tracking-widest text-text-primary">
          VEHICLE DRIVING SIMULATOR
        </h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide bg-status-good/10 border border-status-good text-status-good">
          <span className="pulse"></span>
          SIMULATION ACTIVE
        </div>
      </div>
    </header>
  );
};
