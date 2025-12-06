import React, { useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { KeyboardState } from "../hooks/useKeyboard";
import {
  VehiclePhysicsState,
  createInitialPhysicsState,
  updateVehiclePhysics,
  physicsToVehicleData,
  calculateRPM,
  GearMode,
} from "../utils/vehiclePhysics";
import { SensorData } from "../types/sensorData";
import { createPlaceholderMesh, loadCarModel } from "../scene/modelLoader";
import { setupLighting } from "../scene/lighting";
import { createEnvironment } from "../scene/environment";
import { SpeedOverlay } from "./SpeedOverlay";
import { ControlsHint } from "./ControlsHint";
import { GearModeSelector } from "./GearModeSelector";

interface DrivingSimulatorProps {
  keyboard: KeyboardState;
  onSensorUpdate: (data: Partial<SensorData>) => void;
  gearMode: GearMode;
  onGearModeChange: (mode: GearMode) => void;
}

export const DrivingSimulator: React.FC<DrivingSimulatorProps> = ({
  keyboard,
  onSensorUpdate,
  gearMode,
  onGearModeChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const physicsRef = useRef<VehiclePhysicsState>(createInitialPhysicsState());
  const lastTimeRef = useRef<number>(0);
  const animationIdRef = useRef<number>(0);

  // Store keyboard in a ref so animation loop always has current value
  const keyboardRef = useRef<KeyboardState>(keyboard);
  keyboardRef.current = keyboard;

  // Store gear mode in ref for animation loop
  const gearModeRef = useRef<GearMode>(gearMode);
  gearModeRef.current = gearMode;

  // Store callback in ref to avoid re-creating animation loop
  const onSensorUpdateRef = useRef(onSensorUpdate);
  onSensorUpdateRef.current = onSensorUpdate;

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("");
  const [displayState, setDisplayState] = useState({ speed: 0, gear: "N" });

  const initScene = useCallback(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x89cff0, 80, 350);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(0, 5, -10);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup scene
    setupLighting(scene);
    createEnvironment(scene);

    // Vehicle
    const vehicle = new THREE.Group();
    const placeholder = createPlaceholderMesh();
    vehicle.add(placeholder);
    vehicle.position.set(0, 0, 0);
    scene.add(vehicle);
    carRef.current = vehicle;

    // Load car model
    loadCarModel(vehicle, setProgress).then(() => {
      setLoading(false);
    });

    // Initial physics
    physicsRef.current = {
      ...createInitialPhysicsState(),
      z: 10,
    };

    setLoading(false);

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !cameraRef.current || !rendererRef.current) return;
      const newWidth = containerRef.current.clientWidth;
      const newHeight = containerRef.current.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const cleanup = initScene();

    const animate = (currentTime: number) => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = lastTimeRef.current ? currentTime - lastTimeRef.current : 16;
      lastTimeRef.current = currentTime;

      // Update physics with gear mode
      physicsRef.current = updateVehiclePhysics(
        physicsRef.current,
        keyboardRef.current,
        deltaTime,
        gearModeRef.current
      );

      // Update car position/rotation
      if (carRef.current) {
        carRef.current.position.x = physicsRef.current.x;
        carRef.current.position.z = physicsRef.current.z;
        carRef.current.rotation.y = physicsRef.current.rotation;
      }

      // Update camera
      if (cameraRef.current && carRef.current) {
        const carPosition = carRef.current.position.clone();
        const carRotation = physicsRef.current.rotation;
        const cameraDistance = 8;
        const cameraHeight = 4;

        const targetCameraPos = new THREE.Vector3(
          carPosition.x - Math.sin(carRotation) * cameraDistance,
          carPosition.y + cameraHeight,
          carPosition.z - Math.cos(carRotation) * cameraDistance
        );

        cameraRef.current.position.lerp(targetCameraPos, 0.08);
        cameraRef.current.lookAt(
          new THREE.Vector3(carPosition.x, carPosition.y + 1, carPosition.z)
        );
      }

      // Update sensor data
      const vehicleData = physicsToVehicleData(physicsRef.current, keyboardRef.current);
      const speedKmh = Math.abs(physicsRef.current.velocity * 3.6);
      const rpm = calculateRPM(speedKmh, physicsRef.current.gearNumber);
      const throttle = vehicleData.throttle || 0;

      setDisplayState({
        speed: Math.round(speedKmh),
        gear: physicsRef.current.gear,
      });

      // Calculate sensor values
      const engineTemp = 75 + (rpm / 7000) * 20 + throttle * 10;
      const oilPressure = 25 + (rpm / 7000) * 35;
      const transFluidTemp = 60 + (rpm / 7000) * 30 + throttle * 10;
      const fuelConsumption = 5 + (rpm / 7000) * 10 + throttle * 8;
      const batteryVoltage = 12.6 + (rpm > 1000 ? 1.6 : 0);
      const alternatorOutput = rpm > 1000 ? 14.2 : 0;
      const systemLoad = 20 + throttle * 30 + (rpm / 7000) * 20;

      onSensorUpdateRef.current({
        vehicle: vehicleData as any,
        engine: {
          temperature: engineTemp,
          rpm: rpm,
          oilPressure: oilPressure,
          coolantLevel: 95,
          status: "OPERATIONAL",
        },
        transmission: {
          gear: physicsRef.current.gear,
          fluidTemp: transFluidTemp,
          pressure: 160 + (rpm / 7000) * 40,
        },
        electrical: {
          batteryVoltage: batteryVoltage,
          alternatorOutput: alternatorOutput,
          systemLoad: systemLoad,
        },
        fuel: {
          level: 75,
          consumption: fuelConsumption,
          range: Math.round((75 / fuelConsumption) * 60),
        },
      });

      // Render
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animationIdRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationIdRef.current);
      cleanup?.();
    };
  }, [initScene]);

  return (
    <section className="flex-1 flex flex-col relative">
      <div ref={containerRef} className="flex-1 relative bg-bg-primary">
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-text-secondary text-sm z-[100]">
            <div className="spinner"></div>
            <span>{progress || "Loading simulation..."}</span>
          </div>
        )}
      </div>
      <ControlsHint />
      <SpeedOverlay speed={displayState.speed} gear={displayState.gear} gearMode={gearMode} />
      <GearModeSelector mode={gearMode} onModeChange={onGearModeChange} />
    </section>
  );
};
