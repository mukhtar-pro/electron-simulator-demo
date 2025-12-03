import React from "react";
import { StatusLevel } from "../../types/sensorData";

interface MetricItemProps {
  label: string;
  value: string | number;
  unit?: string;
  status?: StatusLevel;
  showProgress?: boolean;
  progressValue?: number;
  className?: string;
}

const statusColors: Record<StatusLevel, string> = {
  good: "text-status-good",
  normal: "text-text-primary",
  warning: "text-status-warning",
  critical: "text-status-danger",
};

const statusBgColors: Record<StatusLevel, string> = {
  good: "bg-status-good/10",
  normal: "bg-bg-card",
  warning: "bg-status-warning/10",
  critical: "bg-status-danger/10",
};

export const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  unit = "",
  status = "normal",
  showProgress = false,
  progressValue = 0,
  className = "",
}) => {
  const isGearDisplay = className.includes("gear-display");

  return (
    <div
      className={`${statusBgColors[status]} p-4 rounded-lg border border-border/30 transition-all duration-300 hover:border-border/60 hover:shadow-md ${className}`}
    >
      <span className="block text-[10px] text-text-muted mb-2 uppercase tracking-wider font-medium">
        {label}
      </span>
      <span
        className={`block font-mono font-bold ${
          isGearDisplay ? "text-3xl text-accent-highlight" : `text-xl ${statusColors[status]}`
        }`}
      >
        {value}
        <span className="text-sm text-text-muted ml-0.5">{unit}</span>
      </span>
      {showProgress && (
        <div className="mt-3 h-1.5 bg-bg-primary/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-primary to-accent-highlight rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressValue}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};
