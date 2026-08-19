import * as THREE from "three";
import type { EnemyAgent } from "./EnemyAgent";

type Tracer = { line: THREE.Line; material: THREE.LineBasicMaterial; life: number };
type Impact = { mesh: THREE.Mesh; life: number };

/** First-person rifle handling deliberately favors tight cadence and highly visible feedback. */
export class WeaponSystem {
  ammo = 30;
  reserve = 120;
  readonly magazineSize = 30;
  reloading = false;
  private reloadTimer = 0;
  private nextShotAt = 0;
  private recoil = 0;
  private readonly root = new THREE.Group();
  private readonly muzzle = new THREE.PointLight(0xffc06a, 0, 7.5, 2);
  private readonly raycaster = new THREE.Raycaster();
  private readonly tracerMaterial = new THREE.LineBasicMaterial({ color: 0xffd08a, transparent: true, opacity: 0.88 });
  private readonly tracers: Tracer[] = [];
  private readonly impacts: Impact[] = [];

  constructor(
    private scene: THREE.Scene,
    private camera: THREE.PerspectiveCamera,
    private getTargets: () => THREE.Object3D[],
    private onEnemyHit: (enemy: EnemyAgent, point: THREE.Vector3) => void,
    private onShot: () => void,
  ) {
    this.camera.add(this.root);
    this.root.position.set(0.43, -0.37, -0.73);
    this.root.rotation.set(-0.05, -0.16, 0.02);
    this.createViewModel();
  }

  tryFire(now: number) {
    if (this.reloading || now < this.nextShotAt || this.ammo <= 0) return false;
    this.ammo -= 1;
    this.onShot();
    this.nextShotAt = now + 0.094;
    this.recoil = Math.min(1.45, this.recoil + 0.76);
    this.muzzle.intensity = 11;

    const origin = new THREE.Vector3();
    const direction = new THREE.Vector3();
    this.camera.getWorldPosition(origin);
    this.camera.getWorldDirection(direction);
    this.raycaster.set(origin, direction);
    this.raycaster.far = 70;
    const hits = this.raycaster.intersectObjects(this.getTargets(), false);
    const hit = hits[0];
    const end = hit?.point.clone() ?? origin.clone().addScaledVector(direction, 52);
    this.spawnTracer(origin.clone().addScaledVector(direction, 0.58), end);

    const enemy = hit?.object.userData.enemy as EnemyAgent | undefined;
    if (enemy) this.onEnemyHit(enemy, hit.point);
    else if (hit) this.spawnImpact(hit.point, hit.face?.normal ?? new THREE.Vector3(0, 1, 0));
    return true;
  }

  startReload() {
    if (this.reloading || this.ammo >= this.magazineSize || this.reserve <= 0) return false;
    this.reloading = true;
    this.reloadTimer = 1.32;
    return true;
  }

  update(delta: number) {
    this.muzzle.intensity = Math.max(0, this.muzzle.intensity - delta * 35);
    this.recoil = THREE.MathUtils.damp(this.recoil, 0, 13, delta);
    this.root.position.y = -0.37 - this.recoil * 0.028 + Math.sin(performance.now() * 0.0017) * 0.004;
    this.root.rotation.x = -0.05 - this.recoil * 0.085;

    if (this.reloading) {
      this.reloadTimer -= delta;
      this.root.rotation.z = THREE.MathUtils.damp(this.root.rotation.z, -0.24, 8, delta);
      if (this.reloadTimer <= 0) {
        const needed = this.magazineSize - this.ammo;
        const amount = Math.min(needed, this.reserve);
        this.ammo += amount;
        this.reserve -= amount;
        this.reloading = false;
      }
    } else {
      this.root.rotation.z = THREE.MathUtils.damp(this.root.rotation.z, 0.02, 12, delta);
    }

    for (let index = this.tracers.length - 1; index >= 0; index -= 1) {
      const tracer = this.tracers[index];
      tracer.life -= delta;
      tracer.material.opacity = Math.max(0, tracer.life * 8);
      if (tracer.life <= 0) {
        tracer.line.removeFromParent();
        tracer.line.geometry.dispose();
        this.tracers.splice(index, 1);
      }
    }
    for (let index = this.impacts.length - 1; index >= 0; index -= 1) {
      const impact = this.impacts[index];
      impact.life -= delta;
      impact.mesh.scale.multiplyScalar(0.95);
      if (impact.life <= 0) {
        impact.mesh.removeFromParent();
        impact.mesh.geometry.dispose();
        (impact.mesh.material as THREE.Material).dispose();
        this.impacts.splice(index, 1);
      }
    }
  }

  dispose() {
    this.tracerMaterial.dispose();
    this.root.removeFromParent();
  }

  private createViewModel() {
    const graphite = new THREE.MeshStandardMaterial({ color: 0x12191d, roughness: 0.43, metalness: 0.84 });
    const black = new THREE.MeshStandardMaterial({ color: 0x050708, roughness: 0.74, metalness: 0.32 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x6c1710, roughness: 0.45, metalness: 0.58, emissive: 0x250403 });
    const glove = new THREE.MeshStandardMaterial({ color: 0x1f292e, roughness: 0.92, metalness: 0.08 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.86), graphite);
    body.position.set(0.01, -0.03, 0);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.055, 0.8), black);
    rail.position.set(0.01, 0.1, -0.02);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.05, 0.56, 10), black);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.set(0.01, 0, -0.66);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.3), black);
    stock.position.set(0, -0.02, 0.53);
    const magazine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.31, 0.16), accent);
    magazine.position.set(0.01, -0.25, 0.1);
    magazine.rotation.x = -0.18;
    const sight = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.1, 0.17), black);
    sight.position.set(0.01, 0.16, -0.18);
    const sightLens = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.056, 0.012), new THREE.MeshBasicMaterial({ color: 0x9fd5df, transparent: true, opacity: 0.72 }));
    sightLens.position.set(0.01, 0.165, -0.272);
    const shroud = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.074, 0.36, 10), graphite);
    shroud.rotation.x = Math.PI / 2;
    shroud.position.set(0.01, 0, -0.52);
    const selector = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.025, 8), accent);
    selector.rotation.z = Math.PI / 2;
    selector.position.set(0.125, -0.07, 0.14);
    const heatStrip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.025, 0.32), accent);
    heatStrip.position.set(-0.08, 0.045, -0.32);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 9), glove);
    hand.scale.set(0.72, 1, 1.05);
    hand.position.set(-0.15, -0.2, 0.25);
    for (const mesh of [body, rail, barrel, stock, magazine, sight, sightLens, shroud, selector, heatStrip, hand]) {
      mesh.castShadow = true;
      this.root.add(mesh);
    }
    this.muzzle.position.set(0.01, 0, -0.98);
    this.root.add(this.muzzle);
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3) {
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = this.tracerMaterial.clone();
    const line = new THREE.Line(geometry, material);
    this.scene.add(line);
    this.tracers.push({ line, material, life: 0.12 });
  }

  private spawnImpact(point: THREE.Vector3, normal: THREE.Vector3) {
    const material = new THREE.MeshBasicMaterial({ color: 0xffc56e, transparent: true, opacity: 0.92 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.065, 6, 6), material);
    mesh.position.copy(point).addScaledVector(normal, 0.03);
    this.scene.add(mesh);
    this.impacts.push({ mesh, life: 0.2 });
  }
}
