import React from "react";

interface MetricGroupProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  className?: string;
}

export const MetricGroup: React.FC<MetricGroupProps> = ({
  title,
  icon,
  children,
  className = "",
}) => {
  return (
    <div className={`metric-group ${className}`}>
      <h3 className="group-title">
        {icon && <span>{icon} </span>}
        {title}
      </h3>
      <div className="metrics-grid">{children}</div>
    </div>
  );
};
