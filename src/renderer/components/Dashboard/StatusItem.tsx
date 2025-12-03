import React from "react";

interface StatusItemProps {
  label: string;
  value: string;
  status: "good" | "warning" | "critical";
}

export const StatusItem: React.FC<StatusItemProps> = ({ label, value, status }) => {
  return (
    <div className="status-item">
      <span className="status-label">{label}</span>
      <span className={`status-value ${status}`}>{value}</span>
    </div>
  );
};
