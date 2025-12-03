import React from "react";
import { SensorData, getStatusLevel } from "../../types/sensorData";
import { MetricGroup } from "./MetricGroup";
import { MetricItem } from "./MetricItem";
import { StatusItem } from "./StatusItem";

interface DashboardProps {
  data: SensorData;
}

export const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <aside className="w-[480px] bg-bg-secondary border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-bg-tertiary to-bg-secondary border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold tracking-wider text-accent-highlight uppercase">
            Sensor Dashboard
          </h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-card/50 rounded-full border border-border/50">
            <span className="w-2 h-2 bg-status-good rounded-full animate-pulse"></span>
            <span className="text-[10px] text-text-secondary font-medium tracking-wide">
              {formatTime(data.lastUpdate)}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-5 space-y-5">
          {/* Status Overview Card */}
          <div className="bg-gradient-to-br from-bg-card to-bg-tertiary p-5 rounded-xl border border-border shadow-lg">
            <h3 className="text-xs font-bold tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-highlight rounded-full"></span>
              SYSTEM STATUS
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <StatusItem
                label="Engine"
                value={data.status.engineStatus}
                status={data.status.engineStatus === "OPERATIONAL" ? "good" : "warning"}
              />
              <StatusItem
                label="Health"
                value={data.status.systemHealth}
                status={data.status.systemHealth === "GOOD" ? "good" : "warning"}
              />
              <StatusItem
                label="Alerts"
                value={data.status.alerts === 0 ? "NONE" : `${data.status.alerts}`}
                status={data.status.alerts === 0 ? "good" : "warning"}
              />
            </div>
          </div>

          {/* Engine Metrics */}
          <MetricGroup title="ENGINE" icon="🔧">
            <MetricItem
              label="Temperature"
              value={data.engine.temperature.toFixed(2)}
              unit="°C"
              status={getStatusLevel(data.engine.temperature, { warning: 95, critical: 105 })}
            />
            <MetricItem
              label="RPM"
              value={data.engine.rpm.toFixed(2)}
              status={getStatusLevel(data.engine.rpm, { warning: 5000, critical: 6500 })}
            />
            <MetricItem
              label="Oil Pressure"
              value={data.engine.oilPressure.toFixed(2)}
              unit=" PSI"
              status={getStatusLevel(data.engine.oilPressure, { warning: 20, critical: 10 }, true)}
            />
            <MetricItem
              label="Coolant Level"
              value={data.engine.coolantLevel.toFixed(2)}
              unit="%"
              status={getStatusLevel(data.engine.coolantLevel, { warning: 50, critical: 25 }, true)}
            />
          </MetricGroup>

          {/* Electrical Metrics */}
          <MetricGroup title="ELECTRICAL" icon="⚡">
            <MetricItem
              label="Battery"
              value={data.electrical.batteryVoltage.toFixed(2)}
              unit="V"
              status={getStatusLevel(
                data.electrical.batteryVoltage,
                { warning: 11.5, critical: 10.5 },
                true
              )}
            />
            <MetricItem
              label="Alternator"
              value={data.electrical.alternatorOutput.toFixed(2)}
              unit="V"
              status="normal"
            />
            <MetricItem
              label="System Load"
              value={data.electrical.systemLoad.toFixed(2)}
              unit="%"
              status={getStatusLevel(data.electrical.systemLoad, { warning: 80, critical: 95 })}
            />
          </MetricGroup>

          {/* Fuel Metrics */}
          <MetricGroup title="FUEL" icon="⛽">
            <MetricItem
              label="Level"
              value={data.fuel.level.toFixed(2)}
              unit="%"
              status={getStatusLevel(data.fuel.level, { warning: 25, critical: 10 }, true)}
              showProgress
              progressValue={data.fuel.level}
            />
            <MetricItem
              label="Consumption"
              value={data.fuel.consumption.toFixed(2)}
              unit=" L/100km"
              status="normal"
            />
            <MetricItem
              label="Range"
              value={data.fuel.range.toFixed(2)}
              unit=" km"
              status={getStatusLevel(data.fuel.range, { warning: 100, critical: 50 }, true)}
            />
          </MetricGroup>

          {/* Transmission Metrics */}
          <MetricGroup title="TRANSMISSION" icon="⚙">
            <MetricItem
              label="Gear"
              value={data.transmission.gear}
              status="normal"
              className="gear-display"
            />
            <MetricItem
              label="Fluid Temp"
              value={data.transmission.fluidTemp.toFixed(2)}
              unit="°C"
              status={getStatusLevel(data.transmission.fluidTemp, { warning: 100, critical: 120 })}
            />
            <MetricItem
              label="Pressure"
              value={data.transmission.pressure.toFixed(2)}
              unit=" PSI"
              status="normal"
            />
          </MetricGroup>

          {/* Environment Metrics */}
          <MetricGroup title="ENVIRONMENT" icon="🌡">
            <MetricItem
              label="Ambient Temp"
              value={data.environment.ambientTemp.toFixed(2)}
              unit="°C"
              status="normal"
            />
            <MetricItem
              label="Humidity"
              value={data.environment.humidity.toFixed(2)}
              unit="%"
              status="normal"
            />
            <MetricItem
              label="Altitude"
              value={data.environment.altitude.toFixed(2)}
              unit=" m"
              status="normal"
            />
          </MetricGroup>
        </div>
      </div>
    </aside>
  );
};
