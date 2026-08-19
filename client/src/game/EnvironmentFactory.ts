import * as THREE from "three";
import { ASSET_URLS } from "./types";

export type Environment = {
  colliders: THREE.Box3[];
  update: (delta: number, elapsed: number) => void;
  dispose: () => void;
};

/** Industrial level geometry uses material-rich procedural modules so lighting and combat lanes can be tuned together. */
export function createEnvironment(scene: THREE.Scene): Environment {
  const root = new THREE.Group();
  root.name = "Tungsten Rain Breach Arena";
  scene.add(root);
  const colliders: THREE.Box3[] = [];
  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load(ASSET_URLS.floor);
  floorTexture.colorSpace = THREE.SRGBColorSpace;
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(6, 6);
  const wallTexture = textureLoader.load(ASSET_URLS.wall);
  wallTexture.colorSpace = THREE.SRGBColorSpace;
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(3, 2);

  const floorMaterial = new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x2a3539, roughness: 0.63, metalness: 0.28 });
  const wallMaterial = new THREE.MeshStandardMaterial({ map: wallTexture, color: 0x78878a, roughness: 0.78, metalness: 0.15 });
  const steel = new THREE.MeshStandardMaterial({ color: 0x273338, roughness: 0.37, metalness: 0.88 });
  const blackSteel = new THREE.MeshStandardMaterial({ color: 0x11191d, roughness: 0.52, metalness: 0.7 });
  const oxidizedSteel = new THREE.MeshStandardMaterial({ color: 0x35454a, roughness: 0.66, metalness: 0.71 });
  const conduitMaterial = new THREE.MeshStandardMaterial({ color: 0x1c272b, roughness: 0.43, metalness: 0.9 });
  const hazard = new THREE.MeshStandardMaterial({ color: 0x742319, emissive: 0xe3482e, emissiveIntensity: 0.78, roughness: 0.44, metalness: 0.43 });
  const lampGlow = new THREE.MeshBasicMaterial({ color: 0xdde9e4, transparent: true, opacity: 0.95 });
  const puddleMaterial = new THREE.MeshPhysicalMaterial({ color: 0x386a73, roughness: 0.08, metalness: 0.56, transparent: true, opacity: 0.38, clearcoat: 0.95 });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(42, 42), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  root.add(floor);

  const wetSheen = new THREE.Mesh(
    new THREE.PlaneGeometry(28, 16),
    new THREE.MeshPhysicalMaterial({ color: 0x4a8994, roughness: 0.1, metalness: 0.62, transparent: true, opacity: 0.29, clearcoat: 0.85 }),
  );
  wetSheen.rotation.x = -Math.PI / 2;
  wetSheen.position.set(0, 0.012, -1.6);
  root.add(wetSheen);

  const addBox = (size: [number, number, number], position: [number, number, number], material: THREE.Material, collision = false) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    if (collision) colliders.push(new THREE.Box3().setFromObject(mesh));
    return mesh;
  };

  const addPuddle = (width: number, depth: number, x: number, z: number, rotation = 0) => {
    const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), puddleMaterial);
    puddle.scale.set(width, depth, 1);
    puddle.rotation.x = -Math.PI / 2;
    puddle.rotation.z = rotation;
    puddle.position.set(x, 0.018, z);
    root.add(puddle);
  };

  addPuddle(3.7, 0.82, -2.8, 4.1, 0.14);
  addPuddle(4.2, 0.92, 3.5, -1.8, -0.12);
  addPuddle(2.1, 0.48, 8.7, 4.8, 0.2);
  addPuddle(2.8, 0.58, 0.8, -10.5, -0.08);

  addBox([42, 7, 1.2], [0, 3.5, -19.2], wallMaterial, true);
  addBox([42, 7, 1.2], [0, 3.5, 19.2], wallMaterial, true);
  addBox([1.2, 7, 42], [-19.2, 3.5, 0], wallMaterial, true);
  addBox([1.2, 7, 42], [19.2, 3.5, 0], wallMaterial, true);
  addBox([2.8, 5.6, 0.42], [0, 3.5, -18.45], blackSteel, true);
  addBox([2.34, 5.05, 0.2], [0, 3.48, -18.15], hazard, false);
  for (const x of [-16, -12, -8, -4, 4, 8, 12, 16]) {
    addBox([0.16, 6.6, 0.22], [x, 3.3, -18.52], blackSteel, false);
    addBox([3.55, 0.1, 0.14], [x + 1.8, 5.65, -18.53], conduitMaterial, false);
  }
  for (const x of [-13.2, -6.6, 6.6, 13.2]) {
    const brace = addBox([0.12, 3.8, 0.16], [x, 4.1, -18.4], oxidizedSteel, false);
    brace.rotation.z = x < 0 ? -0.48 : 0.48;
  }

  for (const x of [-15.4, -7.8, 7.8, 15.4]) {
    addBox([1.15, 7.2, 1.15], [x, 3.6, -8.2], wallMaterial, true);
    addBox([1.4, 0.22, 1.4], [x, 7.2, -8.2], blackSteel, false);
  }

  const leftCover = addBox([4.6, 1.45, 1.4], [-7.3, 0.78, 4.6], steel, true);
  addBox([4.1, 0.16, 0.16], [-7.3, 1.5, 4.02], hazard, false);
  addBox([2.25, 2.2, 1.7], [-11.8, 1.1, -1.7], blackSteel, true);
  addBox([1.75, 1.1, 1.5], [-3.2, 0.55, -5.3], steel, true);
  addBox([2.2, 1.7, 1.1], [5.3, 0.85, -3.3], blackSteel, true);
  addBox([1.2, 2.5, 2.6], [11.2, 1.25, 4.4], steel, true);
  addBox([2.4, 2.9, 1.4], [-14.1, 1.45, 2.1], oxidizedSteel, true);
  addBox([1.8, 1.1, 2.1], [-13.6, 0.55, 5.2], blackSteel, true);
  addBox([1.4, 2.2, 1.15], [-10.6, 1.1, 7.6], oxidizedSteel, true);
  addBox([2.8, 0.8, 1.1], [6.4, 0.4, 6.5], steel, true);
  addBox([1.6, 1.45, 1.4], [13.6, 0.72, -8.4], blackSteel, true);

  const utilityBay = new THREE.Group();
  utilityBay.position.set(-14.6, 0, -5.3);
  root.add(utilityBay);
  for (let index = 0; index < 3; index += 1) {
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.5 + index * 0.28, 0.52), oxidizedSteel);
    cabinet.position.set(index * 1.22, (2.5 + index * 0.28) / 2, 0);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;
    utilityBay.add(cabinet);
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.05, 0.02), index === 1 ? hazard : lampGlow);
    indicator.position.set(index * 1.22, 1.85, -0.27);
    utilityBay.add(indicator);
  }

  const grateGeometry = new THREE.BoxGeometry(0.07, 0.025, 6.8);
  const grate = new THREE.InstancedMesh(grateGeometry, blackSteel, 34);
  const grateMatrix = new THREE.Matrix4();
  let grateIndex = 0;
  for (const [centerX, centerZ] of [[-2.6, 6.4], [5.5, -2.4]]) {
    for (let offset = -8; offset <= 8; offset += 1) {
      grateMatrix.makeTranslation(centerX + offset * 0.22, 0.029, centerZ);
      grate.setMatrixAt(grateIndex, grateMatrix);
      grateIndex += 1;
    }
  }
  grate.count = grateIndex;
  grate.instanceMatrix.needsUpdate = true;
  root.add(grate);

  const catwalk = new THREE.Group();
  catwalk.position.set(11.8, 2.8, -1.8);
  root.add(catwalk);
  const catwalkDeck = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.18, 3.2), steel);
  catwalkDeck.castShadow = true;
  catwalkDeck.receiveShadow = true;
  catwalk.add(catwalkDeck);
  const catwalkGlow = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.04, 0.1), hazard);
  catwalkGlow.position.set(0, 0.12, -1.42);
  catwalk.add(catwalkGlow);
  for (const z of [-1.25, 1.25]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(9.3, 0.75, 0.08), blackSteel);
    rail.position.set(0, 0.46, z);
    catwalk.add(rail);
  }
  for (const x of [-3.9, -1.3, 1.3, 3.9]) {
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.8, 0.24), blackSteel);
    support.position.set(x, -1.36, 0);
    support.castShadow = true;
    catwalk.add(support);
  }

  const turbine = new THREE.Group();
  turbine.position.set(0, 2.55, -14.7);
  root.add(turbine);
  for (const x of [-5.8, 0, 5.8]) {
    const casing = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.15, 1.42, 20), steel);
    casing.rotation.z = Math.PI / 2;
    casing.position.set(x, 0, 0);
    casing.castShadow = true;
    turbine.add(casing);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 1.48, 20), blackSteel);
    core.rotation.z = Math.PI / 2;
    core.position.set(x, 0, -0.05);
    turbine.add(core);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.12, 8, 24), hazard);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(x, 0, -0.82);
    turbine.add(rim);
  }

  for (const z of [-13.5, -7.5, 1.6, 10.1]) {
    const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 33, 10), blackSteel);
    pipe.rotation.z = Math.PI / 2;
    pipe.position.set(0, 6.4, z);
    pipe.castShadow = true;
    root.add(pipe);
  }
  for (const [x, z, height] of [[-16.7, -1.4, 5.4], [-12.8, 10.7, 4.1], [15.5, 7.2, 5.6], [7.6, -15.9, 4.2]]) {
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, height, 10), conduitMaterial);
    riser.position.set(x, height / 2, z);
    riser.castShadow = true;
    root.add(riser);
    const coupling = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.06, 6, 12), oxidizedSteel);
    coupling.rotation.x = Math.PI / 2;
    coupling.position.set(x, height * 0.56, z);
    root.add(coupling);
  }

  const cableTray = new THREE.Group();
  root.add(cableTray);
  for (const z of [-4.8, 4.8]) {
    const railA = new THREE.Mesh(new THREE.BoxGeometry(25, 0.08, 0.09), conduitMaterial);
    railA.position.set(0, 5.72, z);
    const railB = railA.clone();
    railB.position.y += 0.34;
    cableTray.add(railA, railB);
    for (let x = -11; x <= 11; x += 2.2) {
      const hanger = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.5, 0.08), conduitMaterial);
      hanger.position.set(x, 5.95, z);
      cableTray.add(hanger);
    }
  }

  const signCanvas = document.createElement("canvas");
  signCanvas.width = 512;
  signCanvas.height = 160;
  const context = signCanvas.getContext("2d");
  if (context) {
    context.fillStyle = "#0c1113";
    context.fillRect(0, 0, 512, 160);
    context.strokeStyle = "#e3482e";
    context.lineWidth = 8;
    context.strokeRect(8, 8, 496, 144);
    context.fillStyle = "#e6efed";
    context.font = "bold 58px monospace";
    context.fillText("BAY 04 // LOWER", 32, 96);
  }
  const signTexture = new THREE.CanvasTexture(signCanvas);
  signTexture.colorSpace = THREE.SRGBColorSpace;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 1.6), new THREE.MeshBasicMaterial({ map: signTexture }));
  sign.position.set(-10.2, 4.6, -17.9);
  root.add(sign);

  const chevronSign = new THREE.Group();
  chevronSign.position.set(9.4, 3.8, -17.92);
  root.add(chevronSign);
  for (const x of [-0.31, 0.31]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.19, 1.2, 0.06), hazard);
    bar.position.x = x;
    bar.rotation.z = x < 0 ? -0.56 : 0.56;
    chevronSign.add(bar);
  }

  const keyLight = new THREE.DirectionalLight(0x94b4c3, 2.2);
  keyLight.position.set(-8, 13, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -23;
  keyLight.shadow.camera.right = 23;
  keyLight.shadow.camera.top = 23;
  keyLight.shadow.camera.bottom = -23;
  scene.add(keyLight);
  scene.add(new THREE.HemisphereLight(0x8dbac3, 0x152025, 2.05));
  scene.add(new THREE.AmbientLight(0x35545b, 1.05));

  const lamps: THREE.PointLight[] = [];
  const addLamp = (position: [number, number, number], color: number, intensity: number, distance: number) => {
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.17, 0.3), blackSteel);
    fixture.position.set(...position);
    root.add(fixture);
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.035, 0.18), lampGlow);
    glow.position.set(position[0], position[1] - 0.1, position[2]);
    root.add(glow);
    const light = new THREE.PointLight(color, intensity, distance, 2);
    light.position.set(position[0], position[1] - 0.18, position[2]);
    scene.add(light);
    lamps.push(light);
  };
  addLamp([-8, 5.8, 10], 0xd7edf2, 28, 12);
  addLamp([5.5, 5.3, 5], 0xd7edf2, 24, 12);
  addLamp([12, 5.2, -5.8], 0xd7edf2, 22, 11);
  addLamp([-7, 5.5, -9.5], 0xd7edf2, 18, 10);
  addLamp([0, 5.3, -14.3], 0xe3482e, 16, 9);

  const workCones: THREE.SpotLight[] = [];
  const addWorkCone = (position: [number, number, number], target: [number, number, number]) => {
    const light = new THREE.SpotLight(0xd4edf0, 36, 21, 0.66, 0.64, 1.25);
    light.position.set(...position);
    light.target.position.set(...target);
    light.castShadow = false;
    scene.add(light, light.target);
    workCones.push(light);
  };
  addWorkCone([-8, 7.5, 9], [-7, 0, 2]);
  addWorkCone([6, 7.4, 4], [4, 0, -4]);
  addWorkCone([0, 7.3, -12], [0, 0, -15]);
  addWorkCone([14.2, 6.2, -1.3], [10.8, 1.2, -1.8]);

  const rainCount = THREE.MathUtils.clamp(Math.floor((window.innerWidth * window.innerHeight) / 3600), 220, 420);
  let rainUpdateAccumulator = 0;
  const rainGeometry = new THREE.BufferGeometry();
  const rainPositions = new Float32Array(rainCount * 3);
  for (let index = 0; index < rainCount; index += 1) {
    rainPositions[index * 3] = (Math.random() - 0.5) * 38;
    rainPositions[index * 3 + 1] = Math.random() * 12;
    rainPositions[index * 3 + 2] = (Math.random() - 0.5) * 38;
  }
  rainGeometry.setAttribute("position", new THREE.BufferAttribute(rainPositions, 3));
  const rain = new THREE.Points(rainGeometry, new THREE.PointsMaterial({ color: 0xa5d2da, size: 0.038, transparent: true, opacity: 0.46, depthWrite: false }));
  root.add(rain);

  const steam = new THREE.Group();
  root.add(steam);
  for (const [x, z] of [[-11, -2], [-3, -11], [9, 3], [14, -9]]) {
    const plume = new THREE.Mesh(new THREE.SphereGeometry(0.65, 12, 8), new THREE.MeshBasicMaterial({ color: 0x9fced2, transparent: true, opacity: 0.08, depthWrite: false }));
    plume.position.set(x, 1.1, z);
    plume.scale.set(1, 2.6, 1);
    steam.add(plume);
  }

  return {
    colliders,
    update(delta, elapsed) {
      rainUpdateAccumulator += delta;
      if (rainUpdateAccumulator >= 1 / 30) {
        const rainDelta = rainUpdateAccumulator;
        rainUpdateAccumulator = 0;
        for (let index = 0; index < rainCount; index += 1) {
          const yIndex = index * 3 + 1;
          rainPositions[yIndex] -= rainDelta * (7.5 + (index % 4));
          if (rainPositions[yIndex] < 0.15) {
            rainPositions[yIndex] = 11 + Math.random() * 4;
            rainPositions[index * 3] = (Math.random() - 0.5) * 38;
          }
        }
        (rain.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
      }
      lamps.forEach((lamp, index) => {
        const base = index === lamps.length - 1 ? 16 : 23;
        lamp.intensity = base + Math.sin(elapsed * (1.3 + index * 0.17) + index) * 0.75;
      });
      steam.children.forEach((child, index) => {
        child.position.y = 1.1 + Math.sin(elapsed * 0.5 + index) * 0.2;
        child.rotation.y += delta * 0.08;
      });
      leftCover.position.y = 0.78 + Math.sin(elapsed * 0.65) * 0.006;
    },
    dispose() {
      root.traverse((child) => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Points) child.geometry.dispose();
        if (child instanceof THREE.Mesh) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
      floorTexture.dispose();
      wallTexture.dispose();
      signTexture.dispose();
      root.removeFromParent();
      lamps.forEach((lamp) => lamp.removeFromParent());
      workCones.forEach((light) => {
        light.target.removeFromParent();
        light.removeFromParent();
      });
      keyLight.removeFromParent();
    },
  };
}
