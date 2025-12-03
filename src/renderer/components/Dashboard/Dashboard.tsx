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
    <aside className="dashboard-panel">
      <div className="dashboard-header">
        <h2>SENSOR DASHBOARD</h2>
        <span className="timestamp">LAST UPDATE: {formatTime(data.lastUpdate)}</span>
      </div>

      <div className="dashboard-content">
        {/* Status Overview */}
        <div className="metric-group status-group">
          <h3 className="group-title">SYSTEM STATUS</h3>
          <div className="status-grid">
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
            value={data.engine.temperature}
            unit="°C"
            status={getStatusLevel(data.engine.temperature, { warning: 95, critical: 105 })}
          />
          <MetricItem
            label="RPM"
            value={data.engine.rpm}
            status={getStatusLevel(data.engine.rpm, { warning: 5000, critical: 6500 })}
          />
          <MetricItem
            label="Oil Pressure"
            value={data.engine.oilPressure}
            unit=" PSI"
            status={getStatusLevel(data.engine.oilPressure, { warning: 20, critical: 10 }, true)}
          />
          <MetricItem
            label="Coolant Level"
            value={data.engine.coolantLevel}
            unit="%"
            status={getStatusLevel(data.engine.coolantLevel, { warning: 50, critical: 25 }, true)}
          />
        </MetricGroup>

        {/* Electrical Metrics */}
        <MetricGroup title="ELECTRICAL" icon="⚡">
          <MetricItem
            label="Battery"
            value={data.electrical.batteryVoltage.toFixed(1)}
            unit="V"
            status={getStatusLevel(
              data.electrical.batteryVoltage,
              { warning: 11.5, critical: 10.5 },
              true
            )}
          />
          <MetricItem
            label="Alternator"
            value={data.electrical.alternatorOutput.toFixed(1)}
            unit="V"
            status="normal"
          />
          <MetricItem
            label="System Load"
            value={data.electrical.systemLoad}
            unit="%"
            status={getStatusLevel(data.electrical.systemLoad, { warning: 80, critical: 95 })}
          />
        </MetricGroup>

        {/* Fuel Metrics */}
        <MetricGroup title="FUEL" icon="⛽">
          <MetricItem
            label="Level"
            value={data.fuel.level}
            unit="%"
            status={getStatusLevel(data.fuel.level, { warning: 25, critical: 10 }, true)}
            showProgress
            progressValue={data.fuel.level}
          />
          <MetricItem
            label="Consumption"
            value={data.fuel.consumption.toFixed(1)}
            unit=" L/100km"
            status="normal"
          />
          <MetricItem
            label="Range"
            value={data.fuel.range}
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
            value={data.transmission.fluidTemp}
            unit="°C"
            status={getStatusLevel(data.transmission.fluidTemp, { warning: 100, critical: 120 })}
          />
          <MetricItem
            label="Pressure"
            value={data.transmission.pressure}
            unit=" PSI"
            status="normal"
          />
        </MetricGroup>

        {/* Environment Metrics */}
        <MetricGroup title="ENVIRONMENT" icon="🌡">
          <MetricItem
            label="Ambient Temp"
            value={data.environment.ambientTemp}
            unit="°C"
            status="normal"
          />
          <MetricItem label="Humidity" value={data.environment.humidity} unit="%" status="normal" />
          <MetricItem
            label="Altitude"
            value={data.environment.altitude}
            unit=" m"
            status="normal"
          />
        </MetricGroup>
      </div>
    </aside>
  );
};
