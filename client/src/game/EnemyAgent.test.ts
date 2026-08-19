import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { EnemyAgent } from "./EnemyAgent";

const step = (enemy: EnemyAgent, player: THREE.Vector3, frames: number, start = 0) => {
  for (let frame = 0; frame < frames; frame += 1) enemy.update(1 / 60, start + frame / 60, player);
};

describe("EnemyAgent critique contract", () => {
  it("alerts, engages, and fires only when the player is visible and in range", () => {
    let shots = 0;
    const enemy = new EnemyAgent("SENTINEL-01", new THREE.Vector3(0, 0, 0), () => { shots += 1; }, [], []);
    const player = new THREE.Vector3(0, 0, 10);
    step(enemy, player, 90);
    expect(enemy.currentState).toBe("engage");
    expect(enemy.controllerSnapshot.lineOfSight).toBe(true);
    expect(shots).toBeGreaterThan(0);
  });

  it("enters hit-stun before recovering to an active state", () => {
    const enemy = new EnemyAgent("SENTINEL-02", new THREE.Vector3(0, 0, 0), () => undefined, [], []);
    const player = new THREE.Vector3(0, 0, 10);
    expect(enemy.takeHit(10)).toBe(true);
    enemy.update(1 / 60, 0, player);
    expect(enemy.currentState).toBe("hit");
    step(enemy, player, 30, 0.1);
    expect(enemy.currentState).not.toBe("hit");
    expect(enemy.currentState).not.toBe("dead");
  });

  it("does not fire through authored cover and instead seeks a cover point", () => {
    let shots = 0;
    const blocker = new THREE.Box3(new THREE.Vector3(-2, 0, 4), new THREE.Vector3(2, 4, 6));
    const coverPoint = new THREE.Vector3(5, 0, 0);
    const enemy = new EnemyAgent("SENTINEL-03", new THREE.Vector3(0, 0, 0), () => { shots += 1; }, [blocker], [coverPoint]);
    const player = new THREE.Vector3(0, 0, 10);
    step(enemy, player, 60);
    expect(enemy.controllerSnapshot.lineOfSight).toBe(false);
    expect(shots).toBe(0);
    expect(["seekCover", "patrol"]).toContain(enemy.currentState);
  });
});
