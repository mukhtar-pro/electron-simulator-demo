import React from "react";
import { GearMode } from "../utils/vehiclePhysics";

interface GearModeSelectorProps {
  mode: GearMode;
  onModeChange: (mode: GearMode) => void;
}

export const GearModeSelector: React.FC<GearModeSelectorProps> = ({ mode, onModeChange }) => {
  return (
    <div className="absolute top-4 right-4 bg-black/80 px-4 py-3 rounded-lg z-10">
      <div className="text-xs text-text-muted mb-2 uppercase tracking-wider">Transmission</div>
      <div className="flex gap-2">
        <button
          className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
            mode === "automatic"
              ? "bg-accent-highlight text-bg-primary"
              : "bg-bg-tertiary text-text-secondary hover:bg-bg-card"
          }`}
          onClick={() => onModeChange("automatic")}
        >
          AUTO
        </button>
        <button
          className={`px-3 py-1.5 rounded text-sm font-bold transition-all ${
            mode === "manual"
              ? "bg-accent-highlight text-bg-primary"
              : "bg-bg-tertiary text-text-secondary hover:bg-bg-card"
          }`}
          onClick={() => onModeChange("manual")}
        >
          MANUAL
        </button>
      </div>
    </div>
  );
};
