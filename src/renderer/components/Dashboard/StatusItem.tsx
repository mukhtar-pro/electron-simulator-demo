import React from "react";

interface StatusItemProps {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
}

const statusColors = {
  good: "text-status-good",
  warning: "text-status-warning",
  critical: "text-status-danger",
};

const statusDotColors = {
  good: "bg-status-good",
  warning: "bg-status-warning",
  critical: "bg-status-danger",
};

export const StatusItem: React.FC<StatusItemProps> = ({ label, value, status }) => {
  return (
    <div className="text-center p-3 rounded-lg bg-bg-primary/30">
      <span className="block text-[10px] text-text-muted mb-2 uppercase tracking-wider font-medium">
        {label}
      </span>
      <div className="flex items-center justify-center gap-2">
        <span className={`w-2 h-2 rounded-full ${statusDotColors[status]} animate-pulse`}></span>
        <span className={`text-xs font-bold tracking-wide ${statusColors[status]}`}>{value}</span>
      </div>
    </div>
  );
};
