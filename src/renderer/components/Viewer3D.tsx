import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { SensorData } from "../types/sensorData";

const MODEL_FOLDER = "FBX-Neck_Mech_Walker_by_3DHaupt";
const MODEL_FILES = { mtl: "walker.mtl", obj: "walker.obj" };

const SCENE_CONFIG = {
  backgroundColor: 0x1a1a2e,
  fogNear: 10,
  fogFar: 50,
};

const CAMERA_CONFIG = {
  fov: 60,
  near: 0.1,
  far: 1000,
  initialPosition: { x: 5, y: 3, z: 5 },
  target: { x: 0, y: 1, z: 0 },
};

// 3D Label positions around the model
const LABEL_POSITIONS = {
  engine: new THREE.Vector3(-2.5, 2.5, 0),
  temp: new THREE.Vector3(-2.5, 2.0, 0),
  rpm: new THREE.Vector3(-2.5, 1.5, 0),
  fuel: new THREE.Vector3(2.5, 2.5, 0),
  battery: new THREE.Vector3(2.5, 2.0, 0),
};

// Create a text sprite for 3D labels
function createTextSprite(
  text: string,
  color: string = "#00ff88",
  bgColor: string = "rgba(0, 0, 0, 0.7)"
): THREE.Sprite {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 64;

  // Background
  context.fillStyle = bgColor;
  context.roundRect(0, 0, canvas.width, canvas.height, 8);
  context.fill();

  // Border
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 6);
  context.stroke();

  // Text
  context.fillStyle = color;
  context.font = "bold 24px Consolas, Monaco, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;

  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
  });

  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.5, 0.4, 1);

  return sprite;
}

// Update sprite text
function updateTextSprite(sprite: THREE.Sprite, text: string, color: string = "#00ff88"): void {
  const material = sprite.material as THREE.SpriteMaterial;
  const texture = material.map as THREE.CanvasTexture;
  const canvas = texture.image as HTMLCanvasElement;
  const context = canvas.getContext("2d")!;

  // Clear and redraw
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Background
  context.fillStyle = "rgba(0, 0, 0, 0.75)";
  context.roundRect(0, 0, canvas.width, canvas.height, 8);
  context.fill();

  // Border
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.roundRect(2, 2, canvas.width - 4, canvas.height - 4, 6);
  context.stroke();

  // Text
  context.fillStyle = color;
  context.font = "bold 24px Consolas, Monaco, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  texture.needsUpdate = true;
}

// Get color based on value thresholds
function getValueColor(
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
  inverse = false
): string {
  if (inverse) {
    if (value <= criticalThreshold) return "#ff4444";
    if (value <= warningThreshold) return "#ffaa00";
    return "#00ff88";
  }
  if (value >= criticalThreshold) return "#ff4444";
  if (value >= warningThreshold) return "#ffaa00";
  return "#00ff88";
}

function loadTextFile(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = "text";
    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 0) {
        resolve(xhr.responseText);
      } else {
        reject(new Error("Failed to load " + url + ": HTTP " + xhr.status));
      }
    };
    xhr.onerror = () => reject(new Error("Network error loading " + url));
    xhr.send();
  });
}

function getAssetBasePath(): string {
  const href = window.location.href;
  const isPackaged = href.includes("/app.asar/");
  if (isPackaged) {
    const resourcesIndex = href.indexOf("/resources/");
    if (resourcesIndex !== -1) {
      const resourcesPath = href.substring(0, resourcesIndex + "/resources/".length);
      return resourcesPath + "assets/models/" + MODEL_FOLDER + "/";
    }
  }
  const basePath = href.substring(0, href.lastIndexOf("/") + 1);
  return basePath + "assets/models/" + MODEL_FOLDER + "/";
}

function setupLighting(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
  mainLight.position.set(10, 20, 10);
  mainLight.castShadow = true;
  mainLight.shadow.mapSize.width = 2048;
  mainLight.shadow.mapSize.height = 2048;
  mainLight.shadow.camera.near = 0.5;
  mainLight.shadow.camera.far = 50;
  mainLight.shadow.camera.left = -10;
  mainLight.shadow.camera.right = 10;
  mainLight.shadow.camera.top = 10;
  mainLight.shadow.camera.bottom = -10;
  scene.add(mainLight);
  const fillLight1 = new THREE.DirectionalLight(0x4a90d9, 0.3);
  fillLight1.position.set(-10, 10, -10);
  scene.add(fillLight1);
  const fillLight2 = new THREE.DirectionalLight(0xd94a4a, 0.2);
  fillLight2.position.set(10, 5, -10);
  scene.add(fillLight2);
  scene.add(new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.3));
}

function setupGround(scene: THREE.Scene): void {
  scene.add(new THREE.GridHelper(50, 50, 0x444444, 0x333333));
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 50),
    new THREE.MeshStandardMaterial({ color: 0x2a2a3e, roughness: 0.8, metalness: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  ground.receiveShadow = true;
  scene.add(ground);
}

function onModelLoaded(model: THREE.Object3D, scene: THREE.Scene): void {
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);
  model.scale.setScalar(3 / maxDim);
  box.setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  model.position.set(0, -box.min.y, -center.z);
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(model);
}

function loadOBJWithoutMaterials(
  scene: THREE.Scene,
  setProgress: (msg: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): void {
  const objLoader = new OBJLoader();
  const modelBasePath = getAssetBasePath();
  setProgress("Loading model (fallback)...");
  loadTextFile(modelBasePath + MODEL_FILES.obj)
    .then((objText) => {
      const obj = objLoader.parse(objText);
      obj.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = new THREE.MeshStandardMaterial({
            color: 0x556b2f,
            roughness: 0.7,
            metalness: 0.3,
          });
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      onModelLoaded(obj, scene);
      setLoading(false);
    })
    .catch((error) => {
      console.error("Failed to load model:", error);
      setError("Failed to load 3D model");
      setLoading(false);
    });
}

function loadModel(
  scene: THREE.Scene,
  setProgress: (msg: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
): void {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  const modelBasePath = getAssetBasePath();
  setProgress("Loading materials...");
  mtlLoader.setPath(modelBasePath);
  mtlLoader.load(
    MODEL_FILES.mtl,
    (materials) => {
      materials.preload();
      objLoader.setMaterials(materials);
      objLoader.setPath(modelBasePath);
      setProgress("Loading model...");
      loadTextFile(modelBasePath + MODEL_FILES.obj)
        .then((objText) => {
          const obj = objLoader.parse(objText);
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                (child.material as THREE.Material).side = THREE.DoubleSide;
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          onModelLoaded(obj, scene);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load OBJ:", error);
          setError("Failed to load 3D model");
          setLoading(false);
        });
    },
    undefined,
    (error) => {
      console.error("Failed to load MTL, using fallback:", error);
      loadOBJWithoutMaterials(scene, setProgress, setLoading, setError);
    }
  );
}

interface Viewer3DProps {
  onViewerReady: (resetFn: () => void) => void;
  sensorData?: SensorData;
}

// Interface for 3D sensor labels
interface SensorLabels {
  engine: THREE.Sprite;
  temp: THREE.Sprite;
  rpm: THREE.Sprite;
  fuel: THREE.Sprite;
  battery: THREE.Sprite;
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ onViewerReady, sensorData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const labelsRef = useRef<SensorLabels | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingProgress, setLoadingProgress] = React.useState("Initializing...");
  const [error, setError] = React.useState<string | null>(null);

  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      const { initialPosition, target } = CAMERA_CONFIG;
      cameraRef.current.position.set(initialPosition.x, initialPosition.y, initialPosition.z);
      controlsRef.current.target.set(target.x, target.y, target.z);
      controlsRef.current.update();
    }
  }, []);

  // Create 3D sensor labels
  const createSensorLabels = useCallback((scene: THREE.Scene): SensorLabels => {
    const labels: SensorLabels = {
      engine: createTextSprite("ENGINE: ---", "#00ff88"),
      temp: createTextSprite("TEMP: ---", "#00ff88"),
      rpm: createTextSprite("RPM: ---", "#00d4ff"),
      fuel: createTextSprite("FUEL: ---", "#00ff88"),
      battery: createTextSprite("BATTERY: ---", "#00d4ff"),
    };

    // Position labels around the model
    labels.engine.position.copy(LABEL_POSITIONS.engine);
    labels.temp.position.copy(LABEL_POSITIONS.temp);
    labels.rpm.position.copy(LABEL_POSITIONS.rpm);
    labels.fuel.position.copy(LABEL_POSITIONS.fuel);
    labels.battery.position.copy(LABEL_POSITIONS.battery);

    // Add to scene
    Object.values(labels).forEach((label) => scene.add(label));

    return labels;
  }, []);

  // Update sensor data effect
  useEffect(() => {
    if (!labelsRef.current || !sensorData) return;

    const labels = labelsRef.current;

    // Update engine status
    const engineColor =
      sensorData.engine.status === "OPERATIONAL"
        ? "#00ff88"
        : sensorData.engine.status === "WARNING"
          ? "#ffaa00"
          : "#ff4444";
    updateTextSprite(labels.engine, `ENGINE: ${sensorData.engine.status}`, engineColor);

    // Update temperature
    const tempColor = getValueColor(sensorData.engine.temperature, 90, 100);
    updateTextSprite(labels.temp, `TEMP: ${sensorData.engine.temperature.toFixed(1)}°C`, tempColor);

    // Update RPM
    updateTextSprite(labels.rpm, `RPM: ${Math.round(sensorData.engine.rpm)}`, "#00d4ff");

    // Update fuel
    const fuelColor = getValueColor(sensorData.fuel.level, 40, 20, true);
    updateTextSprite(labels.fuel, `FUEL: ${sensorData.fuel.level.toFixed(0)}%`, fuelColor);

    // Update battery
    const batteryColor = getValueColor(sensorData.electrical.batteryVoltage, 12.0, 11.5, true);
    updateTextSprite(
      labels.battery,
      `BATT: ${sensorData.electrical.batteryVoltage.toFixed(1)}V`,
      batteryColor
    );
  }, [sensorData]);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SCENE_CONFIG.backgroundColor);
    scene.fog = new THREE.Fog(
      SCENE_CONFIG.backgroundColor,
      SCENE_CONFIG.fogNear,
      SCENE_CONFIG.fogFar
    );
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fov,
      width / height,
      CAMERA_CONFIG.near,
      CAMERA_CONFIG.far
    );
    camera.position.set(
      CAMERA_CONFIG.initialPosition.x,
      CAMERA_CONFIG.initialPosition.y,
      CAMERA_CONFIG.initialPosition.z
    );
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(CAMERA_CONFIG.target.x, CAMERA_CONFIG.target.y, CAMERA_CONFIG.target.z);
    controlsRef.current = controls;

    setupLighting(scene);
    setupGround(scene);
    loadModel(scene, setLoadingProgress, setLoading, setError);

    // Create 3D sensor labels
    labelsRef.current = createSensorLabels(scene);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);
    onViewerReady(resetView);

    return () => {
      window.removeEventListener("resize", handleResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [onViewerReady, resetView, createSensorLabels]);

  return (
    <section className="flex-1 flex flex-col relative">
      <div ref={containerRef} className="flex-1 relative bg-bg-primary">
        {loading && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-text-secondary text-sm z-[100]">
            <div className="spinner"></div>
            <span>{loadingProgress}</span>
          </div>
        )}
        {error && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 text-status-danger text-sm z-[100]">
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-6 bg-black/70 px-5 py-2.5 rounded-lg text-xs text-text-secondary z-10">
        <span>Left Click + Drag: Rotate</span>
        <span>Scroll: Zoom</span>
        <span>Right Click + Drag: Pan</span>
      </div>
    </section>
  );
};
