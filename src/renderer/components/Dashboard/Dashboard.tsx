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

  // Get vehicle data with fallback
  const vehicle = data.vehicle || {
    speed: 0,
    steeringAngle: 0,
    throttle: 0,
    brakePressed: false,
    handbrakeEngaged: false,
    direction: "forward" as const,
  };

  // Format steering angle for display (-1 to 1 normalized)
  const formatSteering = (angle: number) => {
    if (Math.abs(angle) < 0.05) return "CENTER";
    const degrees = Math.abs(angle * 35).toFixed(0); // Convert back to degrees (max 35°)
    return angle > 0 ? `LEFT ${degrees}°` : `RIGHT ${degrees}°`;
  };

  return (
    <aside className="w-[480px] bg-bg-secondary border-l border-border flex flex-col shrink-0">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-bg-tertiary to-bg-secondary border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold tracking-wider text-accent-highlight uppercase">
            Vehicle Dashboard
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
          {/* Speedometer Card - Main Focus */}
          <div className="bg-gradient-to-br from-bg-card to-bg-tertiary p-5 rounded-xl border border-border shadow-lg">
            <div className="text-center mb-4">
              <div className="text-5xl font-bold text-accent-highlight mb-1">
                {vehicle.speed.toFixed(0)}
              </div>
              <div className="text-sm text-text-secondary uppercase tracking-wider">km/h</div>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-text-primary">{data.transmission.gear}</div>
                <div className="text-[10px] text-text-secondary uppercase">Gear</div>
              </div>
              <div>
                <div className="text-lg font-bold text-text-primary">
                  {data.engine.rpm.toFixed(0)}
                </div>
                <div className="text-[10px] text-text-secondary uppercase">RPM</div>
              </div>
              <div>
                <div
                  className={`text-lg font-bold ${vehicle.brakePressed ? "text-status-critical" : "text-text-primary"}`}
                >
                  {vehicle.brakePressed ? "ON" : "OFF"}
                </div>
                <div className="text-[10px] text-text-secondary uppercase">Brake</div>
              </div>
            </div>
          </div>

          {/* Vehicle Controls Card */}
          <div className="bg-gradient-to-br from-bg-card to-bg-tertiary p-5 rounded-xl border border-border shadow-lg">
            <h3 className="text-xs font-bold tracking-wider text-text-secondary mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-highlight rounded-full"></span>
              VEHICLE CONTROLS
            </h3>
            {/* Steering Indicator */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-text-secondary">Steering</span>
                <span className="text-xs font-mono text-accent-highlight">
                  {formatSteering(vehicle.steeringAngle)}
                </span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden relative">
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-border"></div>
                <div
                  className="absolute top-0 h-full w-3 bg-accent-highlight rounded-full transition-all duration-100"
                  style={{ left: `calc(50% - ${vehicle.steeringAngle * 45}% - 6px)` }}
                ></div>
              </div>
            </div>
            {/* Throttle Bar */}
            <div className="mb-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-text-secondary">Throttle</span>
                <span className="text-xs font-mono text-status-good">
                  {(vehicle.throttle * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-bg-primary rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-status-good to-green-400 transition-all duration-100"
                  style={{ width: `${vehicle.throttle * 100}%` }}
                ></div>
              </div>
            </div>
            {/* Direction */}
            <div className="flex gap-2">
              <div
                className={`flex-1 py-1.5 rounded text-center text-xs font-medium ${vehicle.direction === "reverse" ? "bg-status-warning text-bg-primary" : "bg-bg-primary text-text-secondary"}`}
              >
                REVERSE
              </div>
              <div
                className={`flex-1 py-1.5 rounded text-center text-xs font-medium ${vehicle.direction === "forward" ? "bg-status-good text-bg-primary" : "bg-bg-primary text-text-secondary"}`}
              >
                FORWARD
              </div>
            </div>
          </div>

          {/* Controls Help Card */}
          <div className="bg-gradient-to-br from-bg-card to-bg-tertiary p-4 rounded-xl border border-border shadow-lg">
            <h3 className="text-xs font-bold tracking-wider text-text-secondary mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-accent-highlight rounded-full"></span>
              KEYBOARD CONTROLS
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">W</kbd>
                <span className="text-text-secondary">/ ↑ Accelerate</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">S</kbd>
                <span className="text-text-secondary">/ ↓ Brake</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">A</kbd>
                <span className="text-text-secondary">/ ← Turn Left</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">D</kbd>
                <span className="text-text-secondary">/ → Turn Right</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">
                  1-5
                </kbd>
                <span className="text-text-secondary">Gears</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">R</kbd>
                <span className="text-text-secondary">Reverse</span>
              </div>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-bg-primary rounded text-text-primary font-mono">
                  Space
                </kbd>
                <span className="text-text-secondary">Handbrake</span>
              </div>
            </div>
          </div>

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
