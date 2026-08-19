# Game Plan: Blacksite Protocol

## Product Boundary

Blacksite Protocol is a **polished browser-playable FPS vertical slice** built in Three.js. It is intentionally scoped to one high-density industrial encounter with responsive first-person controls, a single automatic rifle, reactive enemy security operators, a health/ammo HUD, an objective, and visual atmosphere. It should be judged as an original tactical shooter experience, not as a claim to match the scale, asset volume, studio budget, or proprietary features of any AAA franchise.

## Risk Tasks

### 1. Pointer-Lock First-Person Control

- **Why isolated:** Browser pointer lock depends on a user gesture and can fail silently in embedded preview contexts; mouse capture and keyboard movement must cleanly engage and release.
- **Approach:** Provide an explicit `ENTER OPERATION` overlay that requests pointer lock from the canvas. While locked, mouse deltas rotate yaw and pitch, keyboard input drives collision-clamped movement, Escape unlocks, and a visible paused overlay offers re-entry.
- **Verify:** Click-to-lock works; W/A/S/D movement follows the view direction; the camera cannot clip through arena boundaries; Escape restores an actionable overlay; the `?demo` mode bypasses user input and visibly frames the actual encounter.

### 2. First-Person Weapon Feel

- **Why isolated:** Camera recoil, viewmodel kick, raycast hits, muzzle flash, bullet tracers, particles, and hit feedback need a stable interaction cadence; mixing them with enemies too early hides timing defects.
- **Approach:** Use a fixed-rate automatic rifle with raycast hit-scan, a small procedural viewmodel, recoil and recovery springs, point-light muzzle flash, tracer segments, impact sparks, screen-space hit marker, and a compact ammo indicator.
- **Verify:** Holding fire produces a stable cadence; the weapon does not drift or separate from the camera; recoil recovers predictably; targets only take damage when the reticle intersects them; hits visibly produce impact feedback and decrement ammo.

### 3. Procedural Enemy Motion and Encounter State

- **Why isolated:** The vertical slice needs enemies that convincingly acquire, strafe, fire, react to damage, and die without a skinned GLB animation pipeline or brittle navigation mesh.
- **Approach:** Build simple modular humanoids from Three.js primitives, animate pose offsets procedurally, and use a bounded state machine: idle → alert → combat strafe/fire → hit → dead. Constrain movement to authored combat corridors, with obstacle-aware steering and line-of-sight checks.
- **Verify:** Enemies visibly move toward tactically useful positions rather than walking through cover; idle-to-alert and alert-to-fire transitions are coherent; hit reactions happen once per hit; defeated enemies do not keep shooting or moving.

### 4. Real-Time Lighting and Performance Envelope

- **Why isolated:** A visually dense industrial scene can become muddy or slow if shadow lights, fog, particles, reflections, and geometry are unconstrained.
- **Approach:** Use a limited light budget: one shadow-casting directional key, localized point lights, baked-feeling emissive materials, screen-space fog, inexpensive shaderless rain/steam particles, instanced details, and adjustable quality settings.
- **Verify:** The scene reads at the default 1280×720 view; text and enemy silhouettes remain visible; no large black artifacts appear; gameplay remains interactive with rain and enemy combat active; quality setting visibly changes render load without removing core play.

## Main Build

The main build is a full-screen Three.js scene inside React. It combines a rain-fed industrial breach arena, first-person player locomotion, a compact automatic weapon, three hostile security operators, objective progression, HUD telemetry, environmental audio hooks, and an optional deterministic `?demo` capture mode.

- **Assets needed:** One 16:9 in-engine visual target, seamless wet concrete wall and floor textures, an enemy material reference, and a transparent split-chevron brand mark. Procedural geometry supplies the arena, weapon, and character silhouettes.
- **Verify:**
  - The full-screen game starts from an intentional title/operation overlay; no generic app chrome remains.
  - Player movement follows keyboard input, collision boundaries prevent leaving the playable arena, and pointer lock can be recovered after Escape.
  - The rifle fires, consumes ammunition, reloads, creates recoil/flash/tracer/impact feedback, and hits enemies by raycast.
  - Enemies acquire, strafe, fire, react to hits, die, and update the threat count without obvious animation snapping.
  - Health, ammunition, objective, target count, and reticle are readable at desktop and narrow mobile fallback layouts.
  - No missing texture, blank material, runaway particle system, obvious placeholder color, or 3D clipping dominates the frame.
  - No browser console errors occur in the captured run and TypeScript type checks pass.
  - Visual consistency with the target: wet blue-black concrete, tungsten work-lamp pools, sparse Signal Vermilion warning light, first-person rifle framing, layered industrial cover, and crisp tactical hierarchy.
  - Presentation proof uses `?demo` to show the actual environment and encounter during visual screenshots.
