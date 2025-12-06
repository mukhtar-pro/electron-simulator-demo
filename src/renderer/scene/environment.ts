import * as THREE from "three";

// Track configuration
export const TRACK_CONFIG = {
  roadRadius: 50,
  roadWidth: 14,
};

// Create enhanced environment (ground, road, scenery)
export function createEnvironment(scene: THREE.Scene): void {
  createSkyDome(scene);
  createTerrain(scene);
  createRaceTrack(scene);
  createRacingCurbs(scene);
  createGrandstands(scene);
  createTrees(scene);
  createModernBarriers(scene);
  createStartingGrid(scene);
  createBillboards(scene);
  createLightPoles(scene);
}

function createSkyDome(scene: THREE.Scene): void {
  const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(0x0077ff) },
      bottomColor: { value: new THREE.Color(0x89cff0) },
      offset: { value: 20 },
      exponent: { value: 0.6 },
    },
    vertexShader: `
      varying vec3 vWorldPosition;
      void main() {
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform float offset;
      uniform float exponent;
      varying vec3 vWorldPosition;
      void main() {
        float h = normalize(vWorldPosition + offset).y;
        gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  scene.add(sky);
}

function createTerrain(scene: THREE.Scene): void {
  const groundSize = 600;
  const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize, 100, 100);

  // Add terrain variation
  const vertices = groundGeometry.attributes.position.array;
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const z = vertices[i + 1];
    const distFromCenter = Math.sqrt(x * x + z * z);
    if (distFromCenter > 80) {
      vertices[i + 2] = Math.sin(x * 0.02) * Math.cos(z * 0.02) * 3 + Math.random() * 0.5;
    }
  }
  groundGeometry.computeVertexNormals();

  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c3f,
    roughness: 0.95,
    metalness: 0.0,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.1;
  ground.receiveShadow = true;
  scene.add(ground);
}

function createRaceTrack(scene: THREE.Scene): void {
  const { roadRadius, roadWidth } = TRACK_CONFIG;

  // Track base (asphalt)
  const trackGeometry = new THREE.RingGeometry(
    roadRadius - roadWidth / 2,
    roadRadius + roadWidth / 2,
    128
  );
  const trackMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.85,
    metalness: 0.1,
  });
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.02;
  track.receiveShadow = true;
  scene.add(track);

  // Track edge lines
  const edgeLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    emissive: 0xffffff,
    emissiveIntensity: 0.1,
  });

  const innerEdge = new THREE.Mesh(
    new THREE.RingGeometry(roadRadius - roadWidth / 2, roadRadius - roadWidth / 2 + 0.4, 128),
    edgeLineMaterial
  );
  innerEdge.rotation.x = -Math.PI / 2;
  innerEdge.position.y = 0.03;
  scene.add(innerEdge);

  const outerEdge = new THREE.Mesh(
    new THREE.RingGeometry(roadRadius + roadWidth / 2 - 0.4, roadRadius + roadWidth / 2, 128),
    edgeLineMaterial
  );
  outerEdge.rotation.x = -Math.PI / 2;
  outerEdge.position.y = 0.03;
  scene.add(outerEdge);

  // Center dashed line
  const centerLineMaterial = new THREE.MeshStandardMaterial({
    color: 0xffcc00,
    roughness: 0.3,
    emissive: 0xffcc00,
    emissiveIntensity: 0.15,
  });

  for (let i = 0; i < 60; i++) {
    if (i % 2 === 0) {
      const startAngle = (i / 60) * Math.PI * 2;
      const endAngle = ((i + 0.7) / 60) * Math.PI * 2;
      const dashGeometry = new THREE.RingGeometry(
        roadRadius - 0.15,
        roadRadius + 0.15,
        16,
        1,
        startAngle,
        endAngle - startAngle
      );
      const dash = new THREE.Mesh(dashGeometry, centerLineMaterial);
      dash.rotation.x = -Math.PI / 2;
      dash.position.y = 0.03;
      scene.add(dash);
    }
  }

  // Pit lane
  const pitLaneGeometry = new THREE.PlaneGeometry(roadWidth, roadRadius);
  const pitLane = new THREE.Mesh(pitLaneGeometry, trackMaterial);
  pitLane.rotation.x = -Math.PI / 2;
  pitLane.position.set(0, 0.02, roadRadius / 2);
  pitLane.receiveShadow = true;
  scene.add(pitLane);
}

function createRacingCurbs(scene: THREE.Scene): void {
  const { roadRadius, roadWidth } = TRACK_CONFIG;
  const curbWidth = 1.2;
  const innerRadius = roadRadius - roadWidth / 2 - curbWidth;
  const outerRadius = roadRadius + roadWidth / 2;

  for (let i = 0; i < 80; i++) {
    const startAngle = (i / 80) * Math.PI * 2;
    const endAngle = ((i + 1) / 80) * Math.PI * 2;
    const color = i % 2 === 0 ? 0xff0000 : 0xffffff;

    const curbMaterial = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });

    const innerCurbGeom = new THREE.RingGeometry(
      innerRadius,
      innerRadius + curbWidth,
      8,
      1,
      startAngle,
      endAngle - startAngle
    );
    const innerCurb = new THREE.Mesh(innerCurbGeom, curbMaterial);
    innerCurb.rotation.x = -Math.PI / 2;
    innerCurb.position.y = 0.04;
    scene.add(innerCurb);

    const outerCurbGeom = new THREE.RingGeometry(
      outerRadius,
      outerRadius + curbWidth,
      8,
      1,
      startAngle,
      endAngle - startAngle
    );
    const outerCurb = new THREE.Mesh(outerCurbGeom, curbMaterial);
    outerCurb.rotation.x = -Math.PI / 2;
    outerCurb.position.y = 0.04;
    scene.add(outerCurb);
  }
}

function createGrandstands(scene: THREE.Scene): void {
  const { roadRadius } = TRACK_CONFIG;
  createGrandstand(scene, roadRadius + 25, 0, Math.PI);
  createGrandstand(scene, -(roadRadius + 25), 0, 0);
}

function createGrandstand(scene: THREE.Scene, x: number, z: number, rotation: number): void {
  const grandstand = new THREE.Group();

  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x666666,
    roughness: 0.7,
    metalness: 0.3,
  });
  const structure = new THREE.Mesh(new THREE.BoxGeometry(30, 8, 10), structureMaterial);
  structure.position.y = 4;
  structure.castShadow = true;
  structure.receiveShadow = true;
  grandstand.add(structure);

  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc, roughness: 0.6 });
  for (let row = 0; row < 5; row++) {
    const seatRow = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 1.5), seatMaterial);
    seatRow.position.set(0, 1 + row * 1.4, -3 + row * 1.5);
    grandstand.add(seatRow);
  }

  const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333,
    roughness: 0.5,
    metalness: 0.5,
  });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(32, 0.5, 14), roofMaterial);
  roof.position.y = 10;
  roof.castShadow = true;
  grandstand.add(roof);

  grandstand.position.set(x, 0, z);
  grandstand.rotation.y = rotation;
  scene.add(grandstand);
}

function createTrees(scene: THREE.Scene): void {
  const { roadRadius } = TRACK_CONFIG;

  // Outer trees - avoid pit lane entrance
  for (let i = 0; i < 50; i++) {
    const angle = (i / 50) * Math.PI * 2;
    const radius = roadRadius + 35 + Math.random() * 40;
    const treeX = Math.cos(angle) * radius;
    const treeZ = Math.sin(angle) * radius;

    if (treeZ > -10 && treeZ < roadRadius + 20 && Math.abs(treeX) < 20) continue;

    const tree = createEnhancedTree();
    tree.position.set(treeX, 0, treeZ);
    scene.add(tree);
  }

  // Inner area trees - avoid pit lane
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const radius = 10 + Math.random() * 18;
    const treeX = Math.cos(angle) * radius;
    const treeZ = Math.sin(angle) * radius;

    if (treeZ > -5 && Math.abs(treeX) < 12) continue;

    const tree = createEnhancedTree();
    tree.position.set(treeX, 0, treeZ);
    scene.add(tree);
  }
}

function createEnhancedTree(): THREE.Group {
  const tree = new THREE.Group();
  const treeType = Math.random();

  if (treeType < 0.6) {
    // Pine tree
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3520, roughness: 0.95 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.35, 2.5, 8), trunkMaterial);
    trunk.position.y = 1.25;
    trunk.castShadow = true;
    tree.add(trunk);

    const leafColors = [0x1a5c1a, 0x228b22, 0x2d8b2d];
    for (let i = 0; i < 3; i++) {
      const coneMaterial = new THREE.MeshStandardMaterial({
        color: leafColors[i],
        roughness: 0.85,
      });
      const cone = new THREE.Mesh(new THREE.ConeGeometry(1.8 - i * 0.4, 2.5, 8), coneMaterial);
      cone.position.y = 3 + i * 1.5;
      cone.castShadow = true;
      tree.add(cone);
    }
  } else {
    // Deciduous tree
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 3, 8), trunkMaterial);
    trunk.position.y = 1.5;
    trunk.castShadow = true;
    tree.add(trunk);

    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5a27, roughness: 0.9 });
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(2.5, 12, 12), foliageMaterial);
    foliage.position.y = 5;
    foliage.scale.set(1, 0.8, 1);
    foliage.castShadow = true;
    tree.add(foliage);
  }

  tree.scale.setScalar(0.7 + Math.random() * 0.8);
  tree.rotation.y = Math.random() * Math.PI * 2;
  return tree;
}

function createModernBarriers(scene: THREE.Scene): void {
  const { roadRadius, roadWidth } = TRACK_CONFIG;
  const barrierMaterial = new THREE.MeshStandardMaterial({
    color: 0x404040,
    roughness: 0.3,
    metalness: 0.7,
  });

  const innerRadius = roadRadius - roadWidth / 2 - 3;
  const outerRadius = roadRadius + roadWidth / 2 + 3;

  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const barrierX = Math.cos(angle);
    const barrierZ = Math.sin(angle);
    const isPitLaneEntrance = barrierZ > 0.85 && Math.abs(barrierX) < 0.5;

    if (!isPitLaneEntrance) {
      const innerBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 3), barrierMaterial);
      innerBarrier.position.set(Math.cos(angle) * innerRadius, 0.6, Math.sin(angle) * innerRadius);
      innerBarrier.rotation.y = -angle + Math.PI / 2;
      innerBarrier.castShadow = true;
      scene.add(innerBarrier);
    }

    const outerBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 3), barrierMaterial);
    outerBarrier.position.set(Math.cos(angle) * outerRadius, 0.6, Math.sin(angle) * outerRadius);
    outerBarrier.rotation.y = -angle + Math.PI / 2;
    outerBarrier.castShadow = true;
    scene.add(outerBarrier);
  }

  // Pit lane side barriers
  const pitLaneBarrierOffset = roadWidth / 2 + 1;
  for (let i = 0; i < 8; i++) {
    const leftBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 3), barrierMaterial);
    leftBarrier.position.set(-pitLaneBarrierOffset, 0.6, 5 + i * 5);
    leftBarrier.castShadow = true;
    scene.add(leftBarrier);

    const rightBarrier = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 3), barrierMaterial);
    rightBarrier.position.set(pitLaneBarrierOffset, 0.6, 5 + i * 5);
    rightBarrier.castShadow = true;
    scene.add(rightBarrier);
  }
}

function createStartingGrid(scene: THREE.Scene): void {
  const { roadWidth } = TRACK_CONFIG;
  const gridMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.3,
    emissive: 0xffffff,
    emissiveIntensity: 0.1,
  });

  const startLine = new THREE.Mesh(new THREE.PlaneGeometry(roadWidth - 2, 0.5), gridMaterial);
  startLine.rotation.x = -Math.PI / 2;
  startLine.position.set(0, 0.04, 5);
  scene.add(startLine);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 2; col++) {
      const gridBox = new THREE.Mesh(
        new THREE.PlaneGeometry(2.5, 4),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.3,
          transparent: true,
          opacity: 0.3,
        })
      );
      gridBox.rotation.x = -Math.PI / 2;
      gridBox.position.set(-3 + col * 6, 0.035, 10 + row * 6);
      scene.add(gridBox);
    }
  }
}

function createBillboards(scene: THREE.Scene): void {
  const { roadRadius } = TRACK_CONFIG;
  const positions = [
    { x: roadRadius + 20, z: 30, rot: -Math.PI / 4 },
    { x: -roadRadius - 20, z: -30, rot: Math.PI * 0.75 },
    { x: 30, z: -roadRadius - 20, rot: Math.PI },
    { x: -30, z: roadRadius + 20, rot: 0 },
  ];
  const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44];

  positions.forEach((pos, i) => {
    const billboard = new THREE.Group();

    const postMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.5,
      metalness: 0.7,
    });
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 8, 8), postMaterial);
    post.position.y = 4;
    post.castShadow = true;
    billboard.add(post);

    const boardMaterial = new THREE.MeshStandardMaterial({
      color: colors[i],
      roughness: 0.4,
      emissive: colors[i],
      emissiveIntensity: 0.2,
    });
    const board = new THREE.Mesh(new THREE.BoxGeometry(8, 4, 0.3), boardMaterial);
    board.position.y = 8;
    board.castShadow = true;
    billboard.add(board);

    billboard.position.set(pos.x, 0, pos.z);
    billboard.rotation.y = pos.rot;
    scene.add(billboard);
  });
}

function createLightPoles(scene: THREE.Scene): void {
  const { roadRadius, roadWidth } = TRACK_CONFIG;
  const poleRadius = roadRadius + roadWidth / 2 + 8;

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const pole = new THREE.Group();

    const poleMaterial = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.3,
      metalness: 0.8,
    });
    const polePost = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 12, 8), poleMaterial);
    polePost.position.y = 6;
    polePost.castShadow = true;
    pole.add(polePost);

    const lightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffee,
      emissive: 0xffffaa,
      emissiveIntensity: 0.5,
    });
    const lightFixture = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.5), lightMaterial);
    lightFixture.position.y = 12;
    pole.add(lightFixture);

    pole.position.set(Math.cos(angle) * poleRadius, 0, Math.sin(angle) * poleRadius);
    scene.add(pole);
  }
}
