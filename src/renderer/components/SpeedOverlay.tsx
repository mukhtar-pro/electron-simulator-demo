import React from "react";
import { GearMode } from "../utils/vehiclePhysics";

interface SpeedOverlayProps {
  speed: number;
  gear: string;
  gearMode: GearMode;
}

export const SpeedOverlay: React.FC<SpeedOverlayProps> = ({ speed, gear, gearMode }) => {
  return (
    <div className="absolute top-4 left-4 bg-black/80 px-4 py-3 rounded-lg z-10">
      <div className="text-3xl font-bold font-mono text-accent-highlight">
        {speed}
        <span className="text-sm text-text-muted ml-1">km/h</span>
      </div>
      <div className="text-lg font-bold text-text-primary mt-1">
        Gear: <span className="text-accent-highlight">{gear}</span>
        <span className="text-xs text-text-muted ml-2">
          ({gearMode === "automatic" ? "A" : "M"})
        </span>
      </div>
    </div>
  );
};
