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
    <div
      className={`bg-bg-card/30 rounded-xl border border-border/50 overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 bg-bg-tertiary/50 border-b border-border/50">
        <h3 className="text-xs font-bold tracking-wider text-text-secondary flex items-center gap-2">
          {icon && <span className="text-base">{icon}</span>}
          {title}
        </h3>
      </div>
      <div className="p-4 grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
};
