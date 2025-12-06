import * as THREE from "three";

export function setupLighting(scene: THREE.Scene): void {
  // Ambient light
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // Sun light with shadows
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(50, 100, 50);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 4096;
  sun.shadow.mapSize.height = 4096;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 300;
  sun.shadow.camera.left = -100;
  sun.shadow.camera.right = 100;
  sun.shadow.camera.top = 100;
  sun.shadow.camera.bottom = -100;
  scene.add(sun);

  // Hemisphere light for sky/ground color blend
  const hemisphere = new THREE.HemisphereLight(0x87ceeb, 0x3d5c3d, 0.5);
  scene.add(hemisphere);
}
