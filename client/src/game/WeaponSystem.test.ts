import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { WeaponSystem } from "./WeaponSystem";

const createWeapon = () => {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  scene.add(camera);
  const recoilEvents: Array<[number, number]> = [];
  const weapon = new WeaponSystem(scene, camera, () => [], () => undefined, () => undefined, (pitch, yaw) => recoilEvents.push([pitch, yaw]));
  return { weapon, recoilEvents };
};

describe("WeaponSystem critique contract", () => {
  it("gates cadence while exposing recoil, bloom, muzzle, and camera feedback", () => {
    const { weapon, recoilEvents } = createWeapon();
    expect(weapon.tryFire(1)).toBe(true);
    expect(weapon.tryFire(1.02)).toBe(false);
    expect(weapon.ammo).toBe(29);
    expect(recoilEvents).toHaveLength(1);
    expect(weapon.weaponSnapshot.recoil).toBeGreaterThan(0.5);
    expect(weapon.weaponSnapshot.reticleBloom).toBeGreaterThan(0.2);
    expect(weapon.weaponSnapshot.muzzleIntensity).toBeGreaterThan(10);
    weapon.update(0.32);
    expect(weapon.weaponSnapshot.recoil).toBeLessThan(0.1);
    expect(weapon.weaponSnapshot.reticleBloom).toBeLessThan(0.1);
  });

  it("runs visible eject, insert, chamber, and ammunition-resolution reload states", () => {
    const { weapon } = createWeapon();
    weapon.ammo = 4;
    weapon.reserve = 12;
    expect(weapon.startReload()).toBe(true);
    expect(weapon.weaponSnapshot.reloadPhase).toBe("eject");
    weapon.update(0.5);
    expect(weapon.weaponSnapshot.reloadPhase).toBe("insert");
    weapon.update(0.65);
    expect(weapon.weaponSnapshot.reloadPhase).toBe("chamber");
    weapon.update(0.25);
    expect(weapon.reloading).toBe(false);
    expect(weapon.weaponSnapshot.reloadPhase).toBe("ready");
    expect(weapon.ammo).toBe(16);
    expect(weapon.reserve).toBe(0);
  });
});
