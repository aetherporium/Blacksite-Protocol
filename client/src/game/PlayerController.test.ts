import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { PlayerController } from "./PlayerController";

class ControllerInputProbe {
  actions = new Set<string>();
  aiming = false;
  jump = false;

  isPressed(action: string) { return this.actions.has(action); }
  isAiming() { return this.aiming; }
  consumeJump() {
    const requested = this.jump;
    this.jump = false;
    return requested;
  }
}

const step = (player: PlayerController, frames: number, delta = 1 / 60) => {
  for (let frame = 0; frame < frames; frame += 1) player.update(delta);
};

describe("PlayerController critique contract", () => {
  it("normalizes diagonal input and differentiates walk, sprint, and ADS", () => {
    const probe = new ControllerInputProbe();
    const player = new PlayerController(new THREE.Scene(), probe as never, []);
    probe.actions.add("forward");
    probe.actions.add("right");
    step(player, 90);
    expect(player.currentState).toBe("walk");
    expect(player.controllerSnapshot.speed).toBeGreaterThan(4.2);

    probe.actions.add("sprint");
    step(player, 90);
    expect(player.currentState).toBe("sprint");
    expect(player.controllerSnapshot.speed).toBeGreaterThan(7.1);
    expect(player.controllerSnapshot.fov).toBeGreaterThan(74);

    probe.actions.delete("sprint");
    probe.aiming = true;
    step(player, 60);
    expect(player.currentState).toBe("aim");
    expect(player.controllerSnapshot.fov).toBeLessThan(60);
  });

  it("executes a buffered jump and returns to grounded locomotion", () => {
    const probe = new ControllerInputProbe();
    const player = new PlayerController(new THREE.Scene(), probe as never, []);
    probe.jump = true;
    player.update(1 / 60);
    expect(player.isGrounded).toBe(false);
    expect(player.controllerSnapshot.verticalVelocity).toBeGreaterThan(7);
    step(player, 90);
    expect(player.isGrounded).toBe(true);
    expect(player.position.y).toBe(0);
  });

  it("blocks direct movement and allows a glancing slide around authored cover", () => {
    const probe = new ControllerInputProbe();
    const blocker = new THREE.Box3(new THREE.Vector3(-1, 0, 9.5), new THREE.Vector3(1, 3, 11.2));
    const player = new PlayerController(new THREE.Scene(), probe as never, [blocker]);
    probe.actions.add("forward");
    step(player, 150);
    expect(player.position.z).toBeGreaterThan(11.7);

    const slideProbe = new ControllerInputProbe();
    const slidingPlayer = new PlayerController(new THREE.Scene(), slideProbe as never, [blocker]);
    slideProbe.actions.add("forward");
    slideProbe.actions.add("right");
    step(slidingPlayer, 150);
    expect(slidingPlayer.position.x).toBeGreaterThan(1.1);
    expect(slidingPlayer.position.z).toBeLessThan(10.8);
  });
});
