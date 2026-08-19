# Blacksite Protocol — Architecture

## Runtime Shape

React owns the full-screen shell and static HUD overlays. A single Three.js canvas owns all 3D rendering. The `GameRuntime` object initializes the renderer exactly once, owns event listeners and the render loop, and disposes browser resources when React unmounts.

```text
client/src/
├── components/
│   └── GameCanvas.tsx          React lifecycle host for the full-screen Three.js canvas
├── game/
│   ├── GameRuntime.ts          Main world owner, render loop, state flow, input orchestration
│   ├── PlayerController.ts     Pointer lock, camera, collision-clamped locomotion, health
│   ├── WeaponSystem.ts         Rifle fire cadence, recoil, raycasts, impacts, reload state
│   ├── EnemyAgent.ts           Procedural security operator mesh + explicit combat state machine
│   ├── EnvironmentFactory.ts   Arena geometry, materials, light rigs, particle atmosphere
│   ├── HudBridge.ts             Event-driven bridge from game systems to React HUD
│   ├── InputState.ts           Semantic action tracking and pointer-lock management
│   ├── types.ts                Shared state contracts and configuration
│   └── index.ts                Public runtime factory
├── pages/
│   └── Home.tsx                Game route, operation overlay, HUD, pause, and completion state
└── App.tsx                     Minimal root with the game as the single primary route
```

## Ownership and Modes

`GameRuntime` owns the Three.js `Scene`, `WebGLRenderer`, camera, clock, groups of disposable objects, player controller, weapon system, enemy collection, and environment. `PlayerController` owns only the camera transform and movement state. Each `EnemyAgent` owns one root `Group`, its raycastable body meshes, health, combat timers, and procedural pose. `WeaponSystem` owns the viewmodel, temporary tracer and impact objects, and its fixed-rate fire/reload state.

The runtime uses explicit modes: `briefing`, `active`, `paused`, `complete`, and `failed`. React controls whether an operation overlay is visible, while gameplay state changes flow through a small `HudSnapshot` contract so rendering stays framework-independent.

## Collision and Combat

The arena uses authored axis-aligned collision volumes for walls and cover rather than a physics engine. This keeps first-person movement predictable. The player uses a point-radius resolver against these volumes. Weapon fire is hit-scan using a camera raycast against registered enemy hit meshes. Enemies steer within an authored combat space and use line-of-sight against static cover volumes; this is more reliable than dynamic navigation for a small encounter.

## Visual Layering

Environment geometry uses repeating generated concrete textures where available, procedural trim meshes, vertex-colored steel, emissive warning strips, a low-density fog field, point-light pools, rain/steam particles, and a single directional shadow key. The renderer uses filmic tone mapping, soft shadows, controlled fog, and a subtle vignette overlay in React rather than an expensive postprocess pipeline.

## Cleanup Contract

Every event listener is registered through `InputState` or `GameRuntime`; both own deterministic `dispose()` routines. Temporary impacts, tracers, and particles receive lifetimes and are removed after expiry. `GameCanvas` cancels animation frames and calls `runtime.dispose()` on unmount. Generated asset URLs are external storage URLs and never copied into the WebDev project tree.
