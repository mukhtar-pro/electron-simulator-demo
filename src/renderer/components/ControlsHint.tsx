import React from "react";

interface ControlHint {
  key: string;
  action: string;
}

const controls: ControlHint[] = [
  { key: "W/↑", action: "Forward" },
  { key: "S/↓", action: "Reverse/Brake" },
  { key: "A/D", action: "Steer" },
  { key: "1-5", action: "Gears (Manual)" },
  { key: "R", action: "Reverse" },
  { key: "Space", action: "Handbrake" },
];

export const ControlsHint: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-black/80 px-6 py-3 rounded-lg text-xs text-text-primary z-10">
      {controls.map((control) => (
        <div key={control.key} className="flex flex-col items-center gap-1">
          <span className="font-bold text-accent-highlight">{control.key}</span>
          <span className="text-text-muted">{control.action}</span>
        </div>
      ))}
    </div>
  );
};
