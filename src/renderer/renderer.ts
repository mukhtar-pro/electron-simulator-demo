import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import "./styles/main.css";

// Sensor data interface
interface SensorData {
  engine: {
    temperature: number;
    rpm: number;
    oilPressure: number;
    coolantLevel: number;
  };
  electrical: {
    batteryVoltage: number;
    alternatorOutput: number;
    systemLoad: number;
  };
  fuel: {
    level: number;
    consumption: number;
    range: number;
  };
  transmission: {
    gear: string;
    fluidTemp: number;
    pressure: number;
  };
  environment: {
    ambientTemp: number;
    humidity: number;
    altitude: number;
  };
  status: {
    engineStatus: string;
    systemHealth: string;
    alerts: number;
  };
}

// Static demo sensor data
const sensorData: SensorData = {
  engine: {
    temperature: 87,
    rpm: 850,
    oilPressure: 45,
    coolantLevel: 92,
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
};

class EquipmentViewer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private container: HTMLElement;
  private loadingElement: HTMLElement | null;

  constructor() {
    this.container = document.getElementById("viewer-container")!;
    this.loadingElement = document.getElementById("loading");

    // Initialize scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);

    // Initialize camera
    const aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 10000);
    this.camera.position.set(5, 3, 5);

    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(
      this.container.clientWidth,
      this.container.clientHeight
    );
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // Initialize controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.screenSpacePanning = false;
    this.controls.minDistance = 1;
    this.controls.maxDistance = 100;
    this.controls.maxPolarAngle = Math.PI / 1.5;

    // Setup scene
    this.setupLighting();
    this.setupGround();
    this.loadModel();

    // Handle window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Start animation loop
    this.animate();
  }

  private setupLighting(): void {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    this.scene.add(directionalLight);

    // Fill lights
    const fillLight1 = new THREE.DirectionalLight(0x4a90d9, 0.3);
    fillLight1.position.set(-10, 10, -10);
    this.scene.add(fillLight1);

    const fillLight2 = new THREE.DirectionalLight(0xd94a4a, 0.2);
    fillLight2.position.set(10, 5, -10);
    this.scene.add(fillLight2);

    // Hemisphere light for natural sky lighting
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.3);
    this.scene.add(hemiLight);
  }

  private setupGround(): void {
    // Grid helper
    const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x333333);
    this.scene.add(gridHelper);

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a3e,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private loadModel(): void {
    this.loadOBJModel();
  }

  private loadOBJModel(): void {
    const objLoader = new OBJLoader();
    const modelPath = "./assets/models/uploads_files_2792345_Koenigsegg.obj";

    objLoader.load(
      modelPath,
      (obj) => {
        // Apply default material to OBJ
        obj.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.material = new THREE.MeshStandardMaterial({
              color: 0x888888,
              roughness: 0.5,
              metalness: 0.7,
            });
          }
        });
        this.onModelLoaded(obj);
      },
      (progress) => {
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 100;
          if (this.loadingElement) {
            this.loadingElement.textContent = `Loading model... ${percent.toFixed(
              0
            )}%`;
          }
        }
      },
      (error) => {
        console.error("Failed to load model:", error);
        if (this.loadingElement) {
          this.loadingElement.textContent = "Failed to load 3D model";
          this.loadingElement.style.color = "#ff6b6b";
        }
      }
    );
  }

  private onModelLoaded(model: THREE.Object3D): void {
    // Calculate bounding box to center and scale model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Scale first to reasonable size (target ~3 units tall)
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 3 / maxDim;
    model.scale.setScalar(scale);

    // Recalculate bounding box after scaling
    box.setFromObject(model);
    box.getCenter(center);
    box.getSize(size);

    // Center the model at origin (0, 0, 0) with bottom on ground
    model.position.x = 0;
    model.position.y = -box.min.y; // Place bottom of model on ground (y=0)
    model.position.z = -center.z;

    // Enable shadows
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    this.scene.add(model);

    // Update camera position - zoom * 2 (closer to model)
    const distance = Math.max(size.x, size.y, size.z); // Halved distance = 2x zoom
    this.camera.position.set(distance, distance * 0.5, distance);
    this.controls.target.set(0, 0, 0); // Look at center (0, 0, 0)
    this.controls.update();

    // Hide loading indicator
    if (this.loadingElement) {
      this.loadingElement.style.display = "none";
    }
  }

  private onWindowResize(): void {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  public resetView(): void {
    this.camera.position.set(5, 3, 5);
    this.controls.target.set(0, 1, 0);
    this.controls.update();
  }
}

// Dashboard class
class Dashboard {
  private data: SensorData;

  constructor(data: SensorData) {
    this.data = data;
    this.render();
  }

  private render(): void {
    this.updateMetric(
      "engine-temp",
      `${this.data.engine.temperature}°C`,
      this.getStatus(this.data.engine.temperature, 70, 100)
    );
    this.updateMetric("engine-rpm", `${this.data.engine.rpm}`, "normal");
    this.updateMetric(
      "oil-pressure",
      `${this.data.engine.oilPressure} PSI`,
      this.getStatus(this.data.engine.oilPressure, 30, 60)
    );
    this.updateMetric(
      "coolant-level",
      `${this.data.engine.coolantLevel}%`,
      this.getStatus(this.data.engine.coolantLevel, 80, 100, true)
    );

    this.updateMetric(
      "battery-voltage",
      `${this.data.electrical.batteryVoltage}V`,
      this.getStatus(this.data.electrical.batteryVoltage, 11.5, 14.5)
    );
    this.updateMetric(
      "alternator-output",
      `${this.data.electrical.alternatorOutput}V`,
      "normal"
    );
    this.updateMetric(
      "system-load",
      `${this.data.electrical.systemLoad}%`,
      this.getStatus(this.data.electrical.systemLoad, 0, 80, true)
    );

    this.updateMetric(
      "fuel-level",
      `${this.data.fuel.level}%`,
      this.getStatus(this.data.fuel.level, 20, 100, true)
    );
    this.updateMetric(
      "fuel-consumption",
      `${this.data.fuel.consumption} L/100km`,
      "normal"
    );
    this.updateMetric("fuel-range", `${this.data.fuel.range} km`, "normal");

    this.updateMetric("gear", this.data.transmission.gear, "normal");
    this.updateMetric(
      "trans-temp",
      `${this.data.transmission.fluidTemp}°C`,
      this.getStatus(this.data.transmission.fluidTemp, 40, 90)
    );
    this.updateMetric(
      "trans-pressure",
      `${this.data.transmission.pressure} PSI`,
      "normal"
    );

    this.updateMetric(
      "ambient-temp",
      `${this.data.environment.ambientTemp}°C`,
      "normal"
    );
    this.updateMetric(
      "humidity",
      `${this.data.environment.humidity}%`,
      "normal"
    );
    this.updateMetric(
      "altitude",
      `${this.data.environment.altitude} m`,
      "normal"
    );

    this.updateStatusIndicator("engine-status", this.data.status.engineStatus);
    this.updateStatusIndicator("system-health", this.data.status.systemHealth);
    this.updateStatusIndicator(
      "alerts",
      this.data.status.alerts === 0
        ? "NONE"
        : `${this.data.status.alerts} ACTIVE`
    );
  }

  private updateMetric(id: string, value: string, status: string): void {
    const element = document.getElementById(id);
    if (element) {
      const valueEl = element.querySelector(".metric-value");
      if (valueEl) {
        valueEl.textContent = value;
        valueEl.className = `metric-value ${status}`;
      }
    }
  }

  private updateStatusIndicator(id: string, value: string): void {
    const element = document.getElementById(id);
    if (element) {
      const valueEl = element.querySelector(".status-value");
      if (valueEl) {
        valueEl.textContent = value;
        const status =
          value === "OPERATIONAL" || value === "GOOD" || value === "NONE"
            ? "good"
            : "warning";
        valueEl.className = `status-value ${status}`;
      }
    }
  }

  private getStatus(
    value: number,
    min: number,
    max: number,
    invertWarning: boolean = false
  ): string {
    if (invertWarning) {
      return value < min ? "warning" : "normal";
    }
    if (value < min || value > max) {
      return "warning";
    }
    return "normal";
  }
}

// Initialize application when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const viewer = new EquipmentViewer();
  const dashboard = new Dashboard(sensorData);

  // Setup reset button
  const resetBtn = document.getElementById("reset-view-btn");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => viewer.resetView());
  }
});
