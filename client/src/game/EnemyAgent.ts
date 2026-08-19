import * as THREE from "three";

export type EnemyShotHandler = (damage: number) => void;

/** A procedural security operator: the silhouette stays readable without importing a fragile rigged-model pipeline. */
export class EnemyAgent {
  readonly root = new THREE.Group();
  readonly hitMeshes: THREE.Object3D[] = [];
  readonly id: string;
  health = 100;
  isAlive = true;

  private state: "patrol" | "combat" | "hit" | "dead" = "patrol";
  private strafePhase: number;
  private fireCooldown: number;
  private hitTimer = 0;
  private deathTimer = 0;
  private muzzle: THREE.PointLight;
  private optic: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private bodyMaterial: THREE.MeshStandardMaterial;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;

  constructor(
    id: string,
    position: THREE.Vector3,
    private onShot: EnemyShotHandler,
  ) {
    this.id = id;
    this.root.position.copy(position);
    this.strafePhase = Math.random() * Math.PI * 2;
    this.fireCooldown = 0.8 + Math.random() * 1.2;

    const armor = new THREE.MeshStandardMaterial({
      color: 0x506870,
      roughness: 0.54,
      metalness: 0.72,
      emissive: 0x071012,
    });
    this.bodyMaterial = armor;
    const rubber = new THREE.MeshStandardMaterial({ color: 0x090d10, roughness: 0.87, metalness: 0.16 });
    const fabric = new THREE.MeshStandardMaterial({ color: 0x242d32, roughness: 0.94, metalness: 0.05 });
    const visor = new THREE.MeshBasicMaterial({ color: 0xe3482e });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.94, 0.36), armor);
    body.position.y = 1.48;
    body.castShadow = true;
    body.receiveShadow = true;
    this.addHitMesh(body);

    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.52, 0.42), fabric);
    chest.position.set(0, 1.52, -0.08);
    chest.castShadow = true;
    this.root.add(chest);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.16, 8), rubber);
    neck.position.y = 2.02;
    neck.castShadow = true;
    this.root.add(neck);

    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), armor);
    helmet.scale.z = 0.9;
    helmet.position.y = 2.22;
    helmet.castShadow = true;
    this.addHitMesh(helmet);

    this.optic = new THREE.Mesh(new THREE.SphereGeometry(0.075, 8, 8), visor);
    this.optic.scale.set(1.8, 0.42, 0.32);
    this.optic.position.set(0, 2.22, -0.3);
    this.root.add(this.optic);
    const opticGlow = new THREE.PointLight(0xe3482e, 5.3, 4.2, 2);
    opticGlow.position.set(0, 2.22, -0.34);
    this.root.add(opticGlow);
    const rimGlow = new THREE.PointLight(0xa4cfd1, 2.6, 4.4, 2);
    rimGlow.position.set(0, 2.35, 0.35);
    this.root.add(rimGlow);

    this.leftArm = this.makeArm(-0.52, armor, rubber, true);
    this.rightArm = this.makeArm(0.52, armor, rubber, false);
    this.root.add(this.leftArm, this.rightArm);

    for (const x of [-0.22, 0.22]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.92, 0.27), fabric);
      leg.position.set(x, 0.52, 0.02);
      leg.castShadow = true;
      this.root.add(leg);
      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.16, 0.46), rubber);
      boot.position.set(x, 0.08, -0.1);
      boot.castShadow = true;
      this.root.add(boot);
    }

    const rifle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.12, 0.82), rubber);
    rifle.position.set(0.32, 1.52, -0.54);
    rifle.rotation.x = Math.PI / 2.6;
    rifle.castShadow = true;
    this.root.add(rifle);
    this.muzzle = new THREE.PointLight(0xf7ad5a, 0, 5, 2);
    this.muzzle.position.set(0.32, 1.52, -0.95);
    this.root.add(this.muzzle);
  }

  update(delta: number, elapsed: number, playerPosition: THREE.Vector3) {
    if (!this.isAlive) {
      this.deathTimer += delta;
      this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, this.id.charCodeAt(0) % 2 ? -1.32 : 1.32, delta * 2.2);
      this.root.position.y = Math.max(-0.02, this.root.position.y - delta * 0.5);
      this.muzzle.intensity = 0;
      return;
    }

    const target = playerPosition.clone();
    target.y = this.root.position.y + 1.32;
    this.root.lookAt(target);
    const distance = this.root.position.distanceTo(playerPosition);
    if (distance < 22) this.state = this.hitTimer > 0 ? "hit" : "combat";

    const gait = Math.sin(elapsed * 7 + this.strafePhase);
    this.leftArm.rotation.x = gait * 0.08;
    this.rightArm.rotation.x = -gait * 0.06;
    this.optic.material.color.setHex(this.hitTimer > 0 ? 0xffc49f : 0xe3482e);
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - delta * 22);

    if (this.state === "combat") {
      this.strafePhase += delta * 1.24;
      const away = this.root.position.clone().sub(playerPosition).setY(0).normalize();
      const tangent = new THREE.Vector3(-away.z, 0, away.x);
      const desired = tangent.multiplyScalar(Math.sin(this.strafePhase) * 0.68);
      if (distance < 8.6) desired.add(away.multiplyScalar(0.5));
      if (distance > 13.2) desired.add(away.multiplyScalar(-0.6));
      this.root.position.addScaledVector(desired, delta);
      this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -14.5, 14.5);
      this.root.position.z = THREE.MathUtils.clamp(this.root.position.z, -14.4, 8.4);
      this.fireCooldown -= delta;
      if (this.fireCooldown <= 0) {
        this.fireCooldown = 0.78 + Math.random() * 0.74;
        this.muzzle.intensity = 8;
        this.onShot(4 + Math.round(Math.random() * 3));
      }
    }

    if (this.hitTimer > 0) {
      this.hitTimer -= delta;
      this.bodyMaterial.emissive.setHex(0x4b100a);
      this.root.position.x += Math.sin(elapsed * 34 + this.strafePhase) * delta * 0.25;
    } else {
      this.bodyMaterial.emissive.setHex(0x000000);
    }
  }

  takeHit(damage: number) {
    if (!this.isAlive) return false;
    this.health -= damage;
    this.hitTimer = 0.16;
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.state = "dead";
      this.root.traverse((child) => {
        if (child instanceof THREE.Mesh) child.castShadow = false;
      });
    }
    return true;
  }

  private makeArm(
    x: number,
    armor: THREE.MeshStandardMaterial,
    rubber: THREE.MeshStandardMaterial,
    mirrored: boolean,
  ) {
    const arm = new THREE.Group();
    arm.position.set(x, 1.73, -0.03);
    arm.rotation.z = mirrored ? -0.12 : 0.12;
    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.115, 0.35, 4, 8), armor);
    upper.rotation.z = Math.PI / 2;
    upper.castShadow = true;
    arm.add(upper);
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), rubber);
    glove.position.set(mirrored ? -0.24 : 0.24, -0.05, -0.22);
    glove.castShadow = true;
    arm.add(glove);
    return arm;
  }

  private addHitMesh(mesh: THREE.Mesh) {
    mesh.userData.enemy = this;
    this.hitMeshes.push(mesh);
    this.root.add(mesh);
  }
}
