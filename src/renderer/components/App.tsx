import React, { useState, useCallback, useEffect } from "react";
import { Header } from "./Header";
import { Viewer3D } from "./Viewer3D";
import { Dashboard } from "./Dashboard/Dashboard";
import { SensorData, defaultSensorData } from "../types/sensorData";

export const App: React.FC = () => {
  const [resetViewFn, setResetViewFn] = useState<(() => void) | null>(null);
  const [sensorData, setSensorData] = useState<SensorData>(defaultSensorData);
  const [isOnline] = useState(true);

  const handleViewerReady = useCallback((resetFn: () => void) => {
    setResetViewFn(() => resetFn);
  }, []);

  const handleResetView = useCallback(() => {
    if (resetViewFn) {
      resetViewFn();
    }
  }, [resetViewFn]);

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData((prev) => ({
        ...prev,
        engine: {
          ...prev.engine,
          temperature: prev.engine.temperature + (Math.random() - 0.5) * 2,
          rpm: Math.max(600, Math.min(1200, prev.engine.rpm + (Math.random() - 0.5) * 50)),
        },
        electrical: {
          ...prev.electrical,
          batteryVoltage: 12.4 + Math.random() * 0.4,
          systemLoad: Math.max(
            20,
            Math.min(50, prev.electrical.systemLoad + (Math.random() - 0.5) * 5)
          ),
        },
        environment: {
          ...prev.environment,
          humidity: Math.max(
            30,
            Math.min(60, prev.environment.humidity + (Math.random() - 0.5) * 2)
          ),
        },
        lastUpdate: new Date(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <Header onResetView={handleResetView} isOnline={isOnline} />
      <main className="flex flex-1 overflow-auto min-h-0">
        <Viewer3D onViewerReady={handleViewerReady} sensorData={sensorData} />
        <Dashboard data={sensorData} />
      </main>
    </div>
  );
};
