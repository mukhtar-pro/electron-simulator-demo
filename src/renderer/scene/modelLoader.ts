import * as THREE from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

// Model configuration
const MODEL_FOLDER = "75-chevrolet_camaro_ss";
const MODEL_FILES = { mtl: "Chevrolet_Camaro_SS_High.mtl", obj: "Chevrolet_Camaro_SS_High.obj" };

// Helper to load text files
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

// Get asset base path (works in both dev and packaged mode)
export function getAssetBasePath(): string {
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

// Create a placeholder car mesh while model loads
export function createPlaceholderMesh(): THREE.Group {
  const placeholder = new THREE.Group();

  // Car body
  const bodyGeometry = new THREE.BoxGeometry(2, 0.6, 4);
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.5,
    metalness: 0.5,
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 0.5;
  body.castShadow = true;
  placeholder.add(body);

  // Cabin
  const cabinGeometry = new THREE.BoxGeometry(1.6, 0.5, 2);
  const cabin = new THREE.Mesh(cabinGeometry, bodyMaterial);
  cabin.position.set(0, 1, -0.2);
  cabin.castShadow = true;
  placeholder.add(cabin);

  return placeholder;
}

// Load the car model
export async function loadCarModel(
  vehicleGroup: THREE.Group,
  setProgress: (msg: string) => void
): Promise<void> {
  const mtlLoader = new MTLLoader();
  const objLoader = new OBJLoader();
  const modelBasePath = getAssetBasePath();

  try {
    setProgress("Loading materials...");

    await new Promise<void>((resolve, reject) => {
      mtlLoader.setPath(modelBasePath);
      mtlLoader.load(
        MODEL_FILES.mtl,
        async (materials) => {
          materials.preload();
          objLoader.setMaterials(materials);

          setProgress("Loading car model...");
          try {
            const objText = await loadTextFile(modelBasePath + MODEL_FILES.obj);
            const obj = objLoader.parse(objText);

            // Scale and position the model
            const box = new THREE.Box3().setFromObject(obj);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetScale = 4 / maxDim;
            obj.scale.setScalar(targetScale);

            // Recalculate bounds after scaling
            box.setFromObject(obj);
            const center = box.getCenter(new THREE.Vector3());

            // Center horizontally and sit on ground
            obj.position.set(-center.x, -box.min.y, -center.z);

            // Enable shadows
            obj.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                if (child.material) {
                  (child.material as THREE.Material).side = THREE.DoubleSide;
                }
                child.castShadow = true;
                child.receiveShadow = true;
              }
            });

            // Remove placeholder and add model
            while (vehicleGroup.children.length > 0) {
              vehicleGroup.remove(vehicleGroup.children[0]);
            }
            vehicleGroup.add(obj);
            setProgress("");
            resolve();
          } catch (objError) {
            reject(objError);
          }
        },
        undefined,
        (error) => reject(error)
      );
    });
  } catch {
    // Fallback: load without materials
    setProgress("Loading model (fallback)...");
    try {
      const objText = await loadTextFile(modelBasePath + MODEL_FILES.obj);
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

      // Scale and position
      const box = new THREE.Box3().setFromObject(obj);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetScale = 4 / maxDim;
      obj.scale.setScalar(targetScale);
      box.setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      obj.position.set(-center.x, -box.min.y, -center.z);

      obj.rotation.y = Math.PI / 2;

      while (vehicleGroup.children.length > 0) {
        vehicleGroup.remove(vehicleGroup.children[0]);
      }
      vehicleGroup.add(obj);
      setProgress("");
    } catch (fallbackError) {
      console.error("Failed to load model:", fallbackError);
      setProgress("Failed to load model");
    }
  }
}
