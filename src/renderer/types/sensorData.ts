// Sensor data types

export interface EngineData {
  temperature: number;
  rpm: number;
  oilPressure: number;
  coolantLevel: number;
  status: "OPERATIONAL" | "WARNING" | "CRITICAL" | "OFFLINE";
}

export interface ElectricalData {
  batteryVoltage: number;
  alternatorOutput: number;
  systemLoad: number;
}

export interface FuelData {
  level: number;
  consumption: number;
  range: number;
}

export interface TransmissionData {
  gear: string;
  fluidTemp: number;
  pressure: number;
}

export interface EnvironmentData {
  ambientTemp: number;
  humidity: number;
  altitude: number;
}

export interface SystemStatus {
  engineStatus: "OPERATIONAL" | "WARNING" | "CRITICAL" | "OFFLINE";
  systemHealth: "GOOD" | "FAIR" | "POOR" | "CRITICAL";
  alerts: number;
}

export interface SensorData {
  engine: EngineData;
  electrical: ElectricalData;
  fuel: FuelData;
  transmission: TransmissionData;
  environment: EnvironmentData;
  status: SystemStatus;
  lastUpdate: Date;
}

// Default sensor data
export const defaultSensorData: SensorData = {
  engine: {
    temperature: 87,
    rpm: 850,
    oilPressure: 45,
    coolantLevel: 92,
    status: "OPERATIONAL",
  },
  electrical: {
    batteryVoltage: 12.6,
    alternatorOutput: 14.2,
    systemLoad: 34,
  },
  fuel: {
    level: 78,
    consumption: 8.5,
    range: 420,
  },
  transmission: {
    gear: "P",
    fluidTemp: 65,
    pressure: 180,
  },
  environment: {
    ambientTemp: 22,
    humidity: 45,
    altitude: 156,
  },
  status: {
    engineStatus: "OPERATIONAL",
    systemHealth: "GOOD",
    alerts: 0,
  },
  lastUpdate: new Date(),
};

// Status color helper
export type StatusLevel = "good" | "normal" | "warning" | "critical";

export function getStatusLevel(
  value: number,
  thresholds: { warning: number; critical: number },
  inverse = false
): StatusLevel {
  if (inverse) {
    if (value <= thresholds.critical) return "critical";
    if (value <= thresholds.warning) return "warning";
    return "good";
  }
  if (value >= thresholds.critical) return "critical";
  if (value >= thresholds.warning) return "warning";
  return "good";
}
