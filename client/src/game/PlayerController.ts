import * as THREE from "three";
import { InputState } from "./InputState";

export type PlayerState = "idle" | "walk" | "sprint" | "aim" | "crouch" | "air";

/** A grounded FPS controller with buffered jump, coyote time, air control, camera springs, and authored collision. */
export class PlayerController {
  readonly camera: THREE.PerspectiveCamera;
  readonly position = new THREE.Vector3(0, 0, 12.4);
  health = 100;
  damagePulse = 0;

  private yaw = 0;
  private pitch = -0.035;
  private readonly standHeight = 1.72;
  private readonly crouchHeight = 1.18;
  private eyeHeight = this.standHeight;
  private readonly moveVector = new THREE.Vector3();
  private readonly targetVelocity = new THREE.Vector3();
  private readonly velocity = new THREE.Vector3();
  private verticalVelocity = 0;
  private grounded = true;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private stride = 0;
  private strideAmount = 0;
  private sprintAmount = 0;
  private aimAmount = 0;
  private crouchAmount = 0;
  private currentFov = 70;
  private landingKick = 0;
  private damageKick = 0;
  private lookRoll = 0;
  private state: PlayerState = "idle";

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
    this.lookRoll = THREE.MathUtils.clamp(this.lookRoll - deltaX * 0.00033, -0.045, 0.045);
  }

  update(delta: number) {
    const dt = Math.min(delta, 1 / 20);
    const forward = this.input.isPressed("forward") ? 1 : 0;
    const backward = this.input.isPressed("back") ? 1 : 0;
    const left = this.input.isPressed("left") ? 1 : 0;
    const right = this.input.isPressed("right") ? 1 : 0;
    const localX = right - left;
    const localZ = backward - forward;
    const hasMovementInput = localX !== 0 || localZ !== 0;
    const wantsCrouch = this.input.isPressed("crouch");
    const wantsAim = this.input.isAiming() && !wantsCrouch && this.grounded;
    const wantsSprint = hasMovementInput && this.input.isPressed("sprint") && !wantsAim && !wantsCrouch && this.grounded;

    if (this.input.consumeJump()) this.jumpBufferTimer = 0.14;
    this.jumpBufferTimer = Math.max(0, this.jumpBufferTimer - dt);
    this.coyoteTimer = this.grounded ? 0.11 : Math.max(0, this.coyoteTimer - dt);
    if (this.jumpBufferTimer > 0 && this.coyoteTimer > 0) {
      this.verticalVelocity = 8.2;
      this.grounded = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      this.landingKick = -0.36;
    }

    if (hasMovementInput) {
      const magnitude = Math.hypot(localX, localZ);
      const maxSpeed = wantsSprint ? 7.75 : wantsAim ? 3.1 : wantsCrouch ? 2.25 : 4.85;
      const x = (localX / magnitude) * maxSpeed;
      const z = (localZ / magnitude) * maxSpeed;
      const cos = Math.cos(this.yaw);
      const sin = Math.sin(this.yaw);
      this.targetVelocity.set(x * cos + z * sin, 0, -x * sin + z * cos);
    } else {
      this.targetVelocity.set(0, 0, 0);
    }

    const response = this.grounded ? (hasMovementInput ? 15.5 : 20) : 3.2;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, this.targetVelocity.x, response, dt);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, this.targetVelocity.z, response, dt);
    this.moveVector.set(this.velocity.x * dt, 0, this.velocity.z * dt);
    this.tryMoveHorizontal(this.moveVector);

    this.verticalVelocity -= 24 * dt;
    this.position.y += this.verticalVelocity * dt;
    if (this.position.y <= 0) {
      if (!this.grounded && this.verticalVelocity < -2.5) this.landingKick = Math.min(0.9, -this.verticalVelocity * 0.052);
      this.position.y = 0;
      this.verticalVelocity = 0;
      this.grounded = true;
    }

    const speedFraction = THREE.MathUtils.clamp(this.velocity.length() / 7.75, 0, 1);
    this.strideAmount = THREE.MathUtils.damp(this.strideAmount, this.grounded ? speedFraction : 0, 9.5, dt);
    this.sprintAmount = THREE.MathUtils.damp(this.sprintAmount, wantsSprint ? 1 : 0, 7, dt);
    this.aimAmount = THREE.MathUtils.damp(this.aimAmount, wantsAim ? 1 : 0, 13, dt);
    this.crouchAmount = THREE.MathUtils.damp(this.crouchAmount, wantsCrouch ? 1 : 0, 10, dt);
    this.eyeHeight = THREE.MathUtils.damp(this.eyeHeight, THREE.MathUtils.lerp(this.standHeight, this.crouchHeight, this.crouchAmount), 12, dt);
    this.stride += dt * (5.2 + 9.6 * this.strideAmount + 2.2 * this.sprintAmount);
    this.landingKick = THREE.MathUtils.damp(this.landingKick, 0, 12, dt);
    this.damageKick = THREE.MathUtils.damp(this.damageKick, 0, 7, dt);
    this.lookRoll = THREE.MathUtils.damp(this.lookRoll, 0, 13, dt);
    const targetFov = 70 + this.sprintAmount * 6.8 - this.aimAmount * 11.5 + (this.grounded ? 0 : 1.1);
    this.currentFov = THREE.MathUtils.damp(this.currentFov, targetFov, 8.5, dt);
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
    this.damagePulse = Math.max(0, this.damagePulse - dt * 1.7);
    this.state = !this.grounded ? "air" : wantsCrouch ? "crouch" : wantsAim ? "aim" : wantsSprint ? "sprint" : hasMovementInput ? "walk" : "idle";
    this.syncCamera();
  }

  get movementAmount() { return this.strideAmount; }
  get isSprinting() { return this.sprintAmount; }
  get isAiming() { return this.aimAmount; }
  get currentState() { return this.state; }
  get isGrounded() { return this.grounded; }

  get controllerSnapshot() {
    return {
      state: this.state,
      grounded: this.grounded,
      speed: Number(this.velocity.length().toFixed(3)),
      verticalVelocity: Number(this.verticalVelocity.toFixed(3)),
      fov: Number(this.currentFov.toFixed(2)),
    };
  }

  setDemoPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.position.copy(position);
    this.velocity.set(0, 0, 0);
    this.verticalVelocity = 0;
    this.grounded = true;
    this.strideAmount = 0.56;
    this.sprintAmount = 0;
    this.aimAmount = 0;
    this.crouchAmount = 0;
    this.eyeHeight = this.standHeight;
    this.currentFov = 72;
    this.camera.fov = this.currentFov;
    this.camera.updateProjectionMatrix();
    this.camera.position.copy(position).add(new THREE.Vector3(0, this.eyeHeight, 0));
    this.camera.lookAt(target);
  }

  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.damagePulse = 1;
    this.damageKick = Math.min(1, this.damageKick + 0.7);
  }

  applyWeaponRecoil(pitchImpulse: number, yawImpulse: number) {
    this.pitch = THREE.MathUtils.clamp(this.pitch - pitchImpulse, -1.28, 1.22);
    this.yaw += yawImpulse;
    this.lookRoll = THREE.MathUtils.clamp(this.lookRoll + yawImpulse * 1.8, -0.045, 0.045);
  }

  private tryMoveHorizontal(delta: THREE.Vector3) {
    this.tryMoveAxis(delta.x, 0);
    this.tryMoveAxis(0, delta.z);
  }

  private tryMoveAxis(deltaX: number, deltaZ: number) {
    const candidate = this.position.clone();
    candidate.x = THREE.MathUtils.clamp(candidate.x + deltaX, -17.15, 17.15);
    candidate.z = THREE.MathUtils.clamp(candidate.z + deltaZ, -16.7, 16.6);
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
    const bobX = Math.sin(this.stride * 0.5) * 0.017 * this.strideAmount;
    const bobY = Math.abs(Math.cos(this.stride)) * 0.044 * this.strideAmount;
    this.camera.position.copy(this.position).add(new THREE.Vector3(bobX, this.eyeHeight + bobY + this.landingKick * 0.075 - this.damageKick * 0.045, 0));
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch + this.landingKick * 0.026 - this.damageKick * 0.04;
    this.camera.rotation.z = Math.sin(this.stride * 0.5) * 0.01 * this.strideAmount + this.lookRoll + this.damageKick * 0.035;
  }
}
