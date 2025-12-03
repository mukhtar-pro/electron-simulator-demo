import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

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
}

export const Viewer3D: React.FC<Viewer3DProps> = ({ onViewerReady }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
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
  }, [onViewerReady, resetView]);

  return (
    <section className="viewer-section">
      <div ref={containerRef} className="viewer-container">
        {loading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <span>{loadingProgress}</span>
          </div>
        )}
        {error && (
          <div className="loading-indicator" style={{ color: "#ff6b6b" }}>
            <span>{error}</span>
          </div>
        )}
      </div>
      <div className="viewer-controls-hint">
        <span>Left Click + Drag: Rotate</span>
        <span>Scroll: Zoom</span>
        <span>Right Click + Drag: Pan</span>
      </div>
    </section>
  );
};
