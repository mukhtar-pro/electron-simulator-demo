import React, { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

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
  const [loadingProgress, setLoadingProgress] = React.useState("Loading 3D Model...");
  const [error, setError] = React.useState<string | null>(null);

  const resetView = useCallback(() => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(5, 3, 5);
      controlsRef.current.target.set(0, 1, 0);
      controlsRef.current.update();
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.Fog(0x1a1a2e, 10, 50);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.set(5, 3, 5);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls setup
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = 20;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 1, 0);
    controlsRef.current = controls;

    // Lighting
    setupLighting(scene);

    // Ground
    setupGround(scene);

    // Load model
    loadModel(scene, setLoadingProgress, setLoading, setError);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Window resize handler
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener("resize", handleResize);

    // Pass reset function to parent
    onViewerReady(resetView);

    // Cleanup
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
        <span>🖱 Left Click + Drag: Rotate</span>
        <span>🖱 Scroll: Zoom</span>
        <span>🖱 Right Click + Drag: Pan</span>
      </div>
    </section>
  );
};

function setupLighting(scene: THREE.Scene) {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Main directional light (sun)
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

  // Fill lights
  const fillLight1 = new THREE.DirectionalLight(0x4a90d9, 0.3);
  fillLight1.position.set(-10, 10, -10);
  scene.add(fillLight1);

  const fillLight2 = new THREE.DirectionalLight(0xd94a4a, 0.2);
  fillLight2.position.set(10, 5, -10);
  scene.add(fillLight2);

  // Hemisphere light
  const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.3);
  scene.add(hemiLight);
}

function setupGround(scene: THREE.Scene) {
  // Grid helper
  const gridHelper = new THREE.GridHelper(50, 50, 0x444444, 0x333333);
  scene.add(gridHelper);

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
  scene.add(ground);
}

function loadModel(
  scene: THREE.Scene,
  setProgress: (msg: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  const modelBasePath = "./assets/models/FBX-Neck_Mech_Walker_by_3DHaupt/";
  const mtlFile = "Neck_Mech_Walker_by_3DHaupt-(Wavefront OBJ).mtl";
  const objFile = "Neck_Mech_Walker_by_3DHaupt-(Wavefront OBJ).obj";

  mtlLoader.setPath(modelBasePath);
  mtlLoader.load(
    mtlFile,
    (materials) => {
      console.log("MTL loaded successfully");
      materials.preload();

      objLoader.setMaterials(materials);
      objLoader.setPath(modelBasePath);
      objLoader.load(
        objFile,
        (obj) => {
          console.log("OBJ loaded successfully");

          // Ensure materials render properly
          obj.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              if (child.material) {
                const mat = child.material as THREE.Material;
                mat.side = THREE.DoubleSide;
              }
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          onModelLoaded(obj, scene);
          setLoading(false);
        },
        (progress) => {
          if (progress.total > 0) {
            const percent = (progress.loaded / progress.total) * 100;
            setProgress(`Loading model... ${percent.toFixed(0)}%`);
          }
        },
        (error) => {
          console.error("Failed to load OBJ model:", error);
          setError("Failed to load 3D model");
          setLoading(false);
        }
      );
    },
    (progress) => {
      console.log("Loading MTL:", progress.loaded);
    },
    (error) => {
      console.error("Failed to load MTL:", error);
      loadOBJWithoutMaterials(scene, setProgress, setLoading, setError);
    }
  );
}

function loadOBJWithoutMaterials(
  scene: THREE.Scene,
  setProgress: (msg: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: string | null) => void
) {
  const objLoader = new OBJLoader();
  const modelBasePath = "./assets/models/FBX-Neck_Mech_Walker_by_3DHaupt/";
  const objFile = "Neck_Mech_Walker_by_3DHaupt-(Wavefront OBJ).obj";

  objLoader.setPath(modelBasePath);
  objLoader.load(
    objFile,
    (obj) => {
      console.log("OBJ loaded without materials");

      // Apply default material
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
    },
    undefined,
    (error) => {
      console.error("Failed to load OBJ without materials:", error);
      setError("Failed to load 3D model");
      setLoading(false);
    }
  );
}

function onModelLoaded(model: THREE.Object3D, scene: THREE.Scene) {
  // Calculate bounding box
  const box = new THREE.Box3().setFromObject(model);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  // Scale to reasonable size
  const maxDim = Math.max(size.x, size.y, size.z);
  const scale = 3 / maxDim;
  model.scale.setScalar(scale);

  // Recalculate bounding box after scaling
  box.setFromObject(model);
  box.getCenter(center);
  box.getSize(size);

  // Center the model
  model.position.x = 0;
  model.position.y = -box.min.y;
  model.position.z = -center.z;

  // Enable shadows
  model.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  scene.add(model);
}
