import * as THREE from "three";
import { ASSET_URLS } from "./types";

export type EnemyShotHandler = (damage: number) => void;
export type EnemyState = "patrol" | "alert" | "seekCover" | "engage" | "hit" | "dead";

/** A procedural security operator: the silhouette stays readable without importing a fragile rigged-model pipeline. */
export class EnemyAgent {
  readonly root = new THREE.Group();
  readonly hitMeshes: THREE.Object3D[] = [];
  readonly id: string;
  health = 100;
  isAlive = true;

  private state: EnemyState = "patrol";
  private strafePhase: number;
  private fireCooldown: number;
  private hitTimer = 0;
  private deathTimer = 0;
  private muzzle: THREE.PointLight;
  private optic: THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
  private bodyMaterial: THREE.MeshStandardMaterial;
  private leftArm: THREE.Group;
  private rightArm: THREE.Group;
  private readonly legs: THREE.Mesh[] = [];
  private readonly variant: number;
  private readonly baseHeight: number;
  private readonly sightRay = new THREE.Ray();
  private readonly sightOrigin = new THREE.Vector3();
  private readonly sightDirection = new THREE.Vector3();
  private readonly rayHit = new THREE.Vector3();
  private readonly movementTarget = new THREE.Vector3();
  private alertTimer = 0;
  private currentCover: THREE.Vector3 | null = null;
  private lineOfSight = false;

  constructor(
    id: string,
    position: THREE.Vector3,
    private onShot: EnemyShotHandler,
    private colliders: THREE.Box3[],
    private coverPoints: THREE.Vector3[],
  ) {
    this.id = id;
    this.root.position.copy(position);
    this.baseHeight = position.y;
    this.variant = Number(id.slice(-2)) % 3;
    this.strafePhase = Math.random() * Math.PI * 2;
    this.fireCooldown = (this.variant === 1 ? 0.42 : this.variant === 2 ? 1.05 : 0.72) + Math.random() * 0.42;

    const armor = new THREE.MeshStandardMaterial({
      color: this.variant === 0 ? 0x506870 : this.variant === 1 ? 0x3f555d : 0x60757a,
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
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.34, 0.08), armor);
    chestPlate.position.set(0, 1.55, -0.31);
    chestPlate.castShadow = true;
    this.root.add(chestPlate);
    if (this.variant === 0) {
      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.16), rubber);
      backpack.position.set(0, 1.53, 0.26);
      backpack.castShadow = true;
      this.root.add(backpack);
    } else if (this.variant === 1) {
      const bandolier = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.06), hazardMaterial());
      bandolier.position.set(0.14, 1.53, -0.36);
      bandolier.rotation.z = -0.44;
      this.root.add(bandolier);
    } else {
      const chestLight = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.02), new THREE.MeshBasicMaterial({ color: 0x8ed5d9 }));
      chestLight.position.set(0.18, 1.6, -0.36);
      this.root.add(chestLight);
    }
    const commsUnit = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.07), rubber);
    commsUnit.position.set(-0.19, 1.5, -0.36);
    this.root.add(commsUnit);
    for (const x of [-0.47, 0.47]) {
      const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.19, 10, 7), armor);
      shoulder.scale.set(1.35, 0.74, 0.92);
      shoulder.position.set(x, 1.85, 0);
      shoulder.castShadow = true;
      this.root.add(shoulder);
    }

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
      this.legs.push(leg);
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
    const rifleRail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.46), armor);
    rifleRail.position.set(0.32, 1.62, -0.61);
    rifleRail.rotation.x = Math.PI / 2.6;
    this.root.add(rifleRail);
    if (this.variant === 2) {
      const opticCap = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.14), armor);
      opticCap.position.set(0.32, 1.67, -0.6);
      this.root.add(opticCap);
    }
    this.muzzle = new THREE.PointLight(0xf7ad5a, 0, 5, 2);
    this.muzzle.position.set(0.32, 1.52, -0.95);
    this.root.add(this.muzzle);

    if (typeof document !== "undefined") {
      const operatorTexture = new THREE.TextureLoader().load(ASSET_URLS.operatorSilhouette);
      operatorTexture.colorSpace = THREE.SRGBColorSpace;
      const operatorCard = new THREE.Mesh(
        new THREE.PlaneGeometry(1.12, 2.7),
        new THREE.MeshBasicMaterial({ map: operatorTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
      );
      operatorCard.position.set(0, 1.3, 0.24);
      operatorCard.renderOrder = 2;
      this.root.add(operatorCard);
    }
  }

  update(delta: number, elapsed: number, playerPosition: THREE.Vector3) {
    if (!this.isAlive) {
      this.deathTimer += delta;
      this.root.rotation.z = THREE.MathUtils.lerp(this.root.rotation.z, this.id.charCodeAt(0) % 2 ? -1.32 : 1.32, delta * 2.2);
      this.root.position.y = Math.max(-0.02, this.root.position.y - delta * 0.5);
      this.muzzle.intensity = 0;
      return;
    }

    this.root.position.y = this.baseHeight + Math.sin(elapsed * 14 + this.strafePhase) * 0.022;
    const target = playerPosition.clone();
    target.y = this.root.position.y + 1.32;
    this.root.lookAt(target);
    const distance = this.root.position.distanceTo(playerPosition);
    this.lineOfSight = distance < 22 && this.canSeePlayer(playerPosition);
    this.hitTimer = Math.max(0, this.hitTimer - delta);
    if (this.hitTimer > 0) {
      this.state = "hit";
    } else if (this.state === "hit") {
      this.state = this.lineOfSight ? "seekCover" : "patrol";
    }

    if (this.state !== "hit") {
      if (this.lineOfSight && distance < 18 && this.state === "patrol") {
        this.state = "alert";
        this.alertTimer = 0.36 + this.variant * 0.08;
      }
      if (this.state === "alert") {
        this.alertTimer -= delta;
        if (this.alertTimer <= 0) this.state = distance < 7.2 ? "seekCover" : "engage";
      } else if (!this.lineOfSight) {
        this.state = "seekCover";
      } else if (this.state === "engage" && distance < 6.4) {
        this.state = "seekCover";
      } else if (this.state === "seekCover" && distance > 8.4 && this.lineOfSight) {
        this.state = "engage";
      }
    }

    const gait = Math.sin(elapsed * 7 + this.strafePhase);
    const gaitStrength = this.state === "engage" || this.state === "seekCover" ? 0.2 : this.state === "alert" ? 0.11 : 0.06;
    this.leftArm.rotation.x = gait * gaitStrength;
    this.rightArm.rotation.x = -gait * gaitStrength * 0.82;
    this.legs[0].rotation.x = -gait * gaitStrength * 0.9;
    this.legs[1].rotation.x = gait * gaitStrength * 0.9;
    this.optic.material.color.setHex(this.hitTimer > 0 ? 0xffc49f : 0xe3482e);
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - delta * 22);

    if (this.state === "seekCover") {
      this.currentCover ??= this.findCover(playerPosition);
      if (this.currentCover) {
        this.moveToward(this.currentCover, 3.35 + this.variant * 0.3, delta);
        if (this.root.position.distanceToSquared(this.currentCover) < 0.65) {
          this.currentCover = null;
          this.state = this.lineOfSight ? "engage" : "patrol";
        }
      } else {
        this.state = this.lineOfSight ? "engage" : "patrol";
      }
    } else if (this.state === "engage") {
      this.strafePhase += delta * 1.24;
      const away = this.root.position.clone().sub(playerPosition).setY(0).normalize();
      const tangent = new THREE.Vector3(-away.z, 0, away.x);
      const strafeSpeed = this.variant === 0 ? 0.82 : this.variant === 1 ? 1.05 : 0.56;
      const desired = tangent.multiplyScalar(Math.sin(this.strafePhase) * strafeSpeed);
      if (distance < 8.6) desired.add(away.multiplyScalar(0.5));
      if (distance > 13.2) desired.add(away.multiplyScalar(-0.6));
      this.root.position.addScaledVector(desired, delta);
      this.root.position.x = THREE.MathUtils.clamp(this.root.position.x, -14.5, 14.5);
      this.root.position.z = THREE.MathUtils.clamp(this.root.position.z, -14.4, 8.4);
    }

    this.fireCooldown -= delta;
    if (this.state === "engage" && this.lineOfSight && distance < 18 && this.fireCooldown <= 0) {
      this.fireCooldown = (this.variant === 1 ? 0.42 : this.variant === 2 ? 1.05 : 0.72) + Math.random() * 0.42;
      this.muzzle.intensity = 8;
      this.onShot(4 + Math.round(Math.random() * 3));
    }

    if (this.hitTimer > 0) {
      this.bodyMaterial.emissive.setHex(0x4b100a);
      this.root.position.x += Math.sin(elapsed * 34 + this.strafePhase) * delta * 0.25;
    } else {
      this.bodyMaterial.emissive.setHex(0x000000);
    }
  }

  takeHit(damage: number) {
    if (!this.isAlive) return false;
    this.health -= damage;
    this.hitTimer = 0.22;
    this.state = "hit";
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

  get currentState() { return this.state; }

  get controllerSnapshot() {
    return {
      state: this.state,
      lineOfSight: this.lineOfSight,
      fireCooldown: Number(this.fireCooldown.toFixed(3)),
      health: this.health,
    };
  }

  private canSeePlayer(playerPosition: THREE.Vector3) {
    this.sightOrigin.copy(this.root.position).add(new THREE.Vector3(0, 1.45, 0));
    this.sightDirection.copy(playerPosition).add(new THREE.Vector3(0, 1.35, 0)).sub(this.sightOrigin);
    const distance = this.sightDirection.length();
    this.sightDirection.normalize();
    this.sightRay.set(this.sightOrigin, this.sightDirection);
    return !this.colliders.some((collider) => {
      const intersection = this.sightRay.intersectBox(collider, this.rayHit);
      return intersection !== null && this.sightOrigin.distanceTo(intersection) < distance - 0.35;
    });
  }

  private findCover(playerPosition: THREE.Vector3) {
    let best: THREE.Vector3 | null = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const cover of this.coverPoints) {
      const playerDistance = cover.distanceToSquared(playerPosition);
      const selfDistance = cover.distanceToSquared(this.root.position);
      if (playerDistance < 18 || selfDistance < 0.8) continue;
      const score = selfDistance - playerDistance * 0.16;
      if (score < bestScore) {
        bestScore = score;
        best = cover;
      }
    }
    return best;
  }

  private moveToward(target: THREE.Vector3, speed: number, delta: number) {
    this.movementTarget.copy(target).sub(this.root.position).setY(0);
    if (this.movementTarget.lengthSq() < 0.0001) return;
    this.movementTarget.normalize();
    this.root.position.addScaledVector(this.movementTarget, speed * delta);
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

function hazardMaterial() {
  return new THREE.MeshStandardMaterial({ color: 0x5f1e17, emissive: 0x7d1d14, emissiveIntensity: 0.42, roughness: 0.5, metalness: 0.45 });
}
