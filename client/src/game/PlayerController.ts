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
  private readonly targetVelocity = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private stride = 0;
  private strideAmount = 0;
  private impactKick = 0;
  private sprintAmount = 0;
  private aimAmount = 0;
  private currentFov = 70;

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

    const hasMovementInput = localX !== 0 || localZ !== 0;
    const sprinting = hasMovementInput && this.input.isPressed("sprint");
    if (hasMovementInput) {
      const magnitude = Math.hypot(localX, localZ);
      const speed = sprinting ? 7.65 : 4.8;
      const x = (localX / magnitude) * speed;
      const z = (localZ / magnitude) * speed;
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      this.targetVelocity.set(x * cos + z * sin, 0, -x * sin + z * cos);
    } else {
      this.targetVelocity.set(0, 0, 0);
    }

    const response = hasMovementInput ? 14 : 19;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.targetVelocity.x, response, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.targetVelocity.z, response, delta);
    this.moveVector.copy(this.velocity).multiplyScalar(delta);
    this.tryMove(this.moveVector);

    const speedFraction = THREE.MathUtils.clamp(this.velocity.length() / 7.65, 0, 1);
    this.strideAmount = THREE.MathUtils.damp(this.strideAmount, speedFraction, 9, delta);
    this.sprintAmount = THREE.MathUtils.damp(this.sprintAmount, sprinting ? 1 : 0, 6.5, delta);
    this.stride += delta * (5.5 + 8.6 * this.strideAmount + 2.4 * this.sprintAmount);
    this.impactKick = Math.max(0, this.impactKick - delta * 2.8);
    this.aimAmount = THREE.MathUtils.damp(this.aimAmount, this.input.isAiming() && !sprinting ? 1 : 0, 11, delta);
    const targetFov = 70 + this.sprintAmount * 6.4 - this.aimAmount * 11;
    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 7.5, delta);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();

    this.damagePulse = Math.max(0, this.damagePulse - delta * 1.7);
    this.syncCamera();
  }

  get movementAmount() {
    return this.strideAmount;
  }

  get isSprinting() {
    return this.sprintAmount;
  }

  get isAiming() {
    return this.aimAmount;
  }

  setDemoPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.strideAmount = 0.56;
    this.sprintAmount = 0;
    this.aimAmount = 0;
    this.currentFov = THREE.MathUtils.damp(this.currentFov, 72, 6, 1 / 60);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(position).add(new THREE.Vector3(0, this.eyeHeight, 0));
    this.camera.lookAt(target);
  }

  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.damagePulse = 1;
    this.impactKick = Math.min(1, this.impactKick + 0.6);
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
    const bobX = Math.sin(this.stride * 0.5) * 0.016 * this.strideAmount;
    const bobY = Math.abs(Math.cos(this.stride)) * 0.042 * this.strideAmount;
    this.camera.position.copy(this.position).add(new THREE.Vector3(bobX, this.eyeHeight + bobY - this.impactKick * 0.04, 0));
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch - this.impactKick * 0.035;
    this.camera.rotation.z = Math.sin(this.stride * 0.5) * 0.008 * this.strideAmount;
  }
}
