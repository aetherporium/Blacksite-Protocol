import * as THREE from "three";
import { InputState } from "./InputState";

/** First-person movement uses authored collision volumes for fast, predictable indoor combat. */
export class PlayerController {
  readonly camera: THREE.PerspectiveCamera;
  readonly position = new THREE.Vector3(0, 0, 12.4);
  health = 100;
  damagePulse = 0;

  private yaw = 0;
  private pitch = -0.035;
  private readonly eyeHeight = 1.72;
  private readonly moveVector = new THREE.Vector3();

  constructor(
    scene: THREE.Scene,
    private input: InputState,
    private colliders: THREE.Box3[],
  ) {
    this.camera = new THREE.PerspectiveCamera(70, 16 / 9, 0.06, 180);
    this.camera.rotation.order = "YXZ";
    scene.add(this.camera);
    this.syncCamera();
  }

  onMouseMove(deltaX: number, deltaY: number) {
    this.yaw -= deltaX * 0.00205;
    this.pitch = THREE.MathUtils.clamp(this.pitch - deltaY * 0.0017, -1.28, 1.22);
  }

  update(delta: number) {
    const forward = this.input.isPressed("forward") ? 1 : 0;
    const backward = this.input.isPressed("back") ? 1 : 0;
    const left = this.input.isPressed("left") ? 1 : 0;
    const right = this.input.isPressed("right") ? 1 : 0;
    const localX = right - left;
    const localZ = backward - forward;

    if (localX !== 0 || localZ !== 0) {
      const magnitude = Math.hypot(localX, localZ);
      const speed = this.input.isPressed("sprint") ? 7.5 : 4.75;
      const x = (localX / magnitude) * speed * delta;
      const z = (localZ / magnitude) * speed * delta;
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      this.moveVector.set(x * cos + z * sin, 0, -x * sin + z * cos);
      this.tryMove(this.moveVector);
    }

    this.damagePulse = Math.max(0, this.damagePulse - delta * 1.7);
    this.syncCamera();
  }

  setDemoPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.camera.position.copy(position).add(new THREE.Vector3(0, this.eyeHeight, 0));
    this.camera.lookAt(target);
  }

  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.damagePulse = 1;
  }

  private tryMove(delta: THREE.Vector3) {
    const candidate = this.position.clone().add(delta);
    candidate.x = THREE.MathUtils.clamp(candidate.x, -17.15, 17.15);
    candidate.z = THREE.MathUtils.clamp(candidate.z, -16.7, 16.6);

    const radius = 0.54;
    for (const collider of this.colliders) {
      const nearX = THREE.MathUtils.clamp(candidate.x, collider.min.x, collider.max.x);
      const nearZ = THREE.MathUtils.clamp(candidate.z, collider.min.z, collider.max.z);
      const dx = candidate.x - nearX;
      const dz = candidate.z - nearZ;
      if (dx * dx + dz * dz < radius * radius) return;
    }
    this.position.copy(candidate);
  }

  private syncCamera() {
    this.camera.position.copy(this.position).add(new THREE.Vector3(0, this.eyeHeight, 0));
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
  }
}
