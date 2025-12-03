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

export const MetricItem: React.FC<MetricItemProps> = ({
  label,
  value,
  unit = "",
  status = "normal",
  showProgress = false,
  progressValue = 0,
  className = "",
}) => {
  return (
    <div className={`metric-item ${className}`}>
      <span className="metric-label">{label}</span>
      <span className={`metric-value ${status}`}>
        {value}
        {unit}
      </span>
      {showProgress && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressValue}%` }}></div>
        </div>
      )}
    </div>
  );
};
