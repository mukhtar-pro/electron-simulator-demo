import React, { useState, useCallback } from "react";
import { Header } from "./Header";
import { DrivingSimulator } from "./DrivingSimulator";
import { Dashboard } from "./Dashboard/Dashboard";
import { SensorData, defaultSensorData } from "../types/sensorData";
import { useKeyboard } from "../hooks/useKeyboard";
import { GearMode } from "../utils/vehiclePhysics";

export type { GearMode };

export const App: React.FC = () => {
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);
  const [gearMode, setGearMode] = useState<GearMode>("automatic");
  const keyboard = useKeyboard();

  const handleSensorUpdate = useCallback((data: Partial<SensorData>) => {
    setSensorData((prev) => ({
      ...prev,
      ...data,
      vehicle: { ...prev.vehicle, ...(data.vehicle || {}) },
      engine: { ...prev.engine, ...(data.engine || {}) },
      electrical: { ...prev.electrical, ...(data.electrical || {}) },
      fuel: { ...prev.fuel, ...(data.fuel || {}) },
      transmission: { ...prev.transmission, ...(data.transmission || {}) },
      lastUpdate: new Date(),
    }));
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header />
      <main className="flex flex-1 overflow-auto min-h-0">
        <DrivingSimulator
          keyboard={keyboard}
          onSensorUpdate={handleSensorUpdate}
          gearMode={gearMode}
          onGearModeChange={setGearMode}
        />
        <Dashboard data={sensorData} />
      </main>
    </div>
  );
};
