import * as THREE from "three";
import { AudioSystem } from "./AudioSystem";
import { EnemyAgent } from "./EnemyAgent";
import { createEnvironment, type Environment } from "./EnvironmentFactory";
import { InputState } from "./InputState";
import { PlayerController } from "./PlayerController";
import type { GameMode, GameRuntimeOptions, HudSnapshot } from "./types";
import { INITIAL_HUD } from "./types";
import { WeaponSystem } from "./WeaponSystem";

/** GameRuntime owns the whole Three.js scene and cleans it up with the React canvas lifecycle. */
export class GameRuntime {
  private readonly scene = new THREE.Scene();
  private readonly renderer: THREE.WebGLRenderer;
  private readonly timer = new THREE.Timer();
  private readonly input: InputState;
  private readonly environment: Environment;
  private readonly audio = new AudioSystem();
  private readonly player: PlayerController;
  private readonly weapon: WeaponSystem;
  private readonly enemies: EnemyAgent[] = [];
  private readonly coverPoints = [
    new THREE.Vector3(-7.4, 0, 4.1), new THREE.Vector3(-11.2, 0, -1.2), new THREE.Vector3(-3.1, 0, -4.6),
    new THREE.Vector3(5.8, 0, -2.5), new THREE.Vector3(11.3, 0, 4), new THREE.Vector3(6.2, 0, 6.1),
  ];
  private mode: GameMode = "briefing";
  private animationFrame = 0;
  private elapsed = 0;
  private score = 0;
  private hitMarkerTimer = 0;
  private hudTimer = 0;
  private shadowRefreshTimer = 0;
  private demoTime = 0;
  private demoFireCooldown = 0;
  private disposed = false;

  private onPointerLockChange = () => {
    if (this.options.demo || this.disposed) return;
    const isLocked = document.pointerLockElement === this.canvas;
    if (!isLocked && this.mode === "active") {
      this.input.clear();
      this.setMode("paused");
    }
  };

  private onMouseMove = (event: MouseEvent) => {
    if (!this.options.demo && this.mode === "active" && document.pointerLockElement === this.canvas) {
      this.player.onMouseMove(event.movementX, event.movementY);
    }
  };

  private onResize = () => {
    const width = Math.max(1, this.canvas.clientWidth);
    const height = Math.max(1, this.canvas.clientHeight);
    this.player.camera.aspect = width / height;
    this.player.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.renderer.shadowMap.needsUpdate = true;
  };

  constructor(private canvas: HTMLCanvasElement, private options: GameRuntimeOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: window.devicePixelRatio <= 1.35, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.35));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.38;
    this.scene.background = new THREE.Color(0x071015);
    this.scene.fog = new THREE.FogExp2(0x071015, 0.023);
    this.input = new InputState(canvas);
    this.environment = createEnvironment(this.scene);
    this.player = new PlayerController(this.scene, this.input, this.environment.colliders);
    this.weapon = new WeaponSystem(this.scene, this.player.camera, () => this.enemies.flatMap((enemy) => enemy.isAlive ? enemy.hitMeshes : []), (enemy, point) => this.handleEnemyHit(enemy, point), () => this.audio.rifleShot(), (pitch, yaw) => this.player.applyWeaponRecoil(pitch, yaw));
    this.weapon.setPresentationMode(options.demo);
    this.createEncounter();

    document.addEventListener("pointerlockchange", this.onPointerLockChange);
    document.addEventListener("mousemove", this.onMouseMove);
    window.addEventListener("resize", this.onResize);
    this.onResize();
    this.options.onHud({ ...INITIAL_HUD, mode: options.demo ? "active" : "briefing" });
    if (options.demo) {
      this.mode = "active";
      this.demoTime = 3.4;
      this.demoFireCooldown = 0;
    }
    this.renderLoop();
  }

  beginOperation() {
    if (this.mode === "complete" || this.mode === "failed") return;
    this.audio.unlock();
    this.setMode("active");
    this.canvas.requestPointerLock?.();
  }

  resume() {
    if (this.mode !== "paused") return;
    this.audio.unlock();
    this.setMode("active");
    this.canvas.requestPointerLock?.();
  }

  restart() {
    window.location.reload();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.animationFrame);
    document.removeEventListener("pointerlockchange", this.onPointerLockChange);
    document.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("resize", this.onResize);
    if (document.pointerLockElement === this.canvas) document.exitPointerLock?.();
    this.input.dispose();
    this.audio.dispose();
    this.weapon.dispose();
    this.environment.dispose();
    this.scene.clear();
    this.renderer.dispose();
  }

  private createEncounter() {
    const layout = [
      ["SENTINEL-01", new THREE.Vector3(0.65, 0, 0.7)],
      ["SENTINEL-02", new THREE.Vector3(-7.4, 0, -5.6)],
      ["SENTINEL-03", new THREE.Vector3(11.5, 2.95, -1.6)],
    ] as const;
    layout.forEach(([id, position]) => {
      const enemy = new EnemyAgent(id, position, (damage) => {
        this.player.damage(damage);
        this.audio.enemyShot();
      }, this.environment.colliders, this.coverPoints);
      this.enemies.push(enemy);
      this.scene.add(enemy.root);
    });
  }

  private handleEnemyHit(enemy: EnemyAgent, point: THREE.Vector3) {
    if (!enemy.takeHit(34)) return;
    this.audio.hitConfirm();
    this.hitMarkerTimer = 0.13;
    const spark = new THREE.PointLight(0xff8c52, 6, 2.8, 2);
    spark.position.copy(point);
    this.scene.add(spark);
    window.setTimeout(() => spark.removeFromParent(), 70);
    if (!enemy.isAlive) this.score += 100;
  }

  private renderLoop = () => {
    if (this.disposed) return;
    this.animationFrame = requestAnimationFrame(this.renderLoop);
    this.timer.update();
    const delta = Math.min(this.timer.getDelta(), 0.05);
    this.elapsed += delta;

    if (this.options.demo) this.updateDemo(delta);
    else if (this.mode === "active") this.updateActive(delta);

    this.environment.update(delta, this.elapsed);
    this.weapon.update(delta, this.player.movementAmount, this.player.isSprinting, this.player.isAiming);
    this.shadowRefreshTimer -= delta;
    if (this.shadowRefreshTimer <= 0) {
      this.renderer.shadowMap.needsUpdate = true;
      this.shadowRefreshTimer = 0.16;
    }
    this.hitMarkerTimer = Math.max(0, this.hitMarkerTimer - delta);
    this.hudTimer -= delta;
    if (this.hudTimer <= 0) {
      this.hudTimer = 0.1;
      this.emitHud();
    }
    this.renderer.render(this.scene, this.player.camera);
  };

  private updateActive(delta: number) {
    this.player.update(delta);
    if (this.input.consumeReload()) this.weapon.startReload();
    if (this.input.isFiring(this.mode)) this.weapon.tryFire(performance.now() * 0.001);
    this.updateEnemies(delta);
    if (this.input.consumePause()) document.exitPointerLock?.();
  }

  private updateDemo(delta: number) {
    this.demoTime += delta;
    const position = new THREE.Vector3(
      Math.sin(this.demoTime * 0.27) * 1.7,
      0,
      9.5 - Math.cos(this.demoTime * 0.18) * 0.8,
    );
    const living = this.enemies.find((enemy) => enemy.isAlive);
    const target = living ? living.root.position.clone().add(new THREE.Vector3(0.18, 1.55, 0)) : new THREE.Vector3(0, 2, -15);
    target.x += Math.sin(this.demoTime * 2.2) * 0.8;
    target.y += Math.cos(this.demoTime * 1.6) * 0.22;
    this.player.setDemoPose(position, target);
    this.updateEnemies(delta);
    this.demoFireCooldown -= delta;
    if (this.demoFireCooldown <= 0 && this.demoTime > 1.3) {
      this.demoFireCooldown = 0.27;
      this.weapon.tryFire(performance.now() * 0.001);
    }
  }

  private updateEnemies(delta: number) {
    this.enemies.forEach((enemy) => enemy.update(delta, this.elapsed, this.player.position));
    const threats = this.enemies.filter((enemy) => enemy.isAlive).length;
    if (this.player.health <= 0 && this.mode !== "failed") this.setMode("failed");
    if (threats === 0 && this.mode === "active") this.setMode("complete");
  }

  private setMode(mode: GameMode) {
    this.mode = mode;
    this.emitHud();
  }

  private emitHud() {
    const threats = this.enemies.filter((enemy) => enemy.isAlive).length;
    const status = this.mode === "active" ? "LINK STABLE" : this.mode === "paused" ? "SIGNAL HOLD" : this.mode === "complete" ? "ARRAY SECURED" : this.mode === "failed" ? "LINK LOST" : "AWAITING BREACH";
    const objective = threats === 0 ? "SECURE THE LOWER ARRAY" : `ELIMINATE HOSTILE SIGNALS // ${threats} REMAINING`;
    const snapshot: HudSnapshot = {
      mode: this.mode,
      health: this.player.health,
      ammo: this.weapon.ammo,
      reserve: this.weapon.reserve,
      threats,
      objective,
      status,
      score: this.score,
      elapsed: this.elapsed,
      hitMarker: this.hitMarkerTimer > 0,
      damagePulse: this.player.damagePulse,
      reloading: this.weapon.reloading,
    };
    this.options.onHud(snapshot);
  }
}
