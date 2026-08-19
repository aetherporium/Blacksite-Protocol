# First-Person Controller Critique Contract

## Scope

This pass evaluates actual simulation behavior, not only screenshots. Each subsystem must meet its own acceptance criteria before the next one is integrated. Browser-only constraints remain explicit: this is an original Three.js vertical slice, not a claim of a proprietary AAA engine or asset pipeline.

| Subsystem | Acceptance criteria | Critique evidence |
|---|---|---|
| Locomotion | Directional velocity accelerates and decelerates smoothly; diagonal input is normalized; sprint, strafing, air control, jump, landing, and aim have differentiated movement response. | Deterministic controller probe plus in-game input test. |
| Camera | Mouse look is frame-rate independent; sprint changes FOV; movement creates restrained bob; jump/landing and damage produce separate spring impulses; pitch remains clamped. | Numeric state trace and live controller review. |
| Weapon | ADS settles independently of sprint; firing creates deterministic recoil impulse, reticle bloom, muzzle light, tracer/impact feedback, reload state, and recovery. | Weapon-state trace plus live encounter check. |
| Enemies | Hostiles alternate patrol, alert, engage, strafe, seek-cover, hit-stun, and death states. Their firing is gated by range and line of sight. | State-transition trace in deterministic demo. |
| Combat feedback | Damage, hit confirmation, muzzle flash, enemy fire, and death remain legible without obscuring the HUD. | Screenshot and code-level event inspection. |
| Frame stability | Added motion and AI do not introduce console errors; simulation logic runs in a fixed-step accumulator. | Production build, clean-start console, and measured update budget. |

## Critique Rule

> A subsystem is accepted only when its written behavior is implemented, a deterministic test can exercise it, and a live run shows no console error. Visual comparison can assess presentation; it cannot prove movement, physics, or game feel without exercising the simulation.

## Movement Critique Result

The movement controller now uses normalized directional input, velocity damping, ground and air response, axis-separated collision sliding, buffered jump, coyote time, sprint FOV, ADS reduction, crouch eye-height transition, and separate landing/damage camera impulses. The deterministic controller suite verifies walk/sprint/aim distinction, jump-and-land behavior, direct collision blocking, and glancing slide behavior. This subsystem is accepted for integration; its live visual behavior remains subject to normal playtesting rather than a still-image-only judgment.

## Weapon Critique Result

Weapon handling now differentiates hip fire and ADS recoil, gates fire cadence, applies a camera recoil callback, tracks reticle bloom, drives a high-intensity muzzle pulse, and exposes eject/insert/chamber reload phases. The deterministic weapon suite verifies cadence blocking, recoil/bloom recovery, muzzle emission, recoil callback delivery, staged reload transition, and reserve-limited ammunition resolution. This subsystem is accepted for integration.

## Enemy Critique Result

Hostiles now move through patrol, alert, seek-cover, engage, hit-stun, and death states. A ray-to-authored-collider line-of-sight gate prevents firing through cover; visible, in-range enemies alert before engagement; low-distance encounters initiate cover seeking; and hits create a short, explicit interruption before state recovery. The deterministic enemy suite verifies alert-to-engage and firing behavior, hit-stun recovery, blocked sight-line fire suppression, and cover-seeking state selection. This subsystem is accepted for integration.

## Integrated Controller Result

The full controller rebuild passes **8 deterministic tests** across player locomotion, weapon feedback, and enemy behavior. Type checking and the production build pass. A clean development-server restart and live briefing/demo captures show the revised controls and encounter without a current runtime failure. Existing historical hot-reload errors remain in the retained log, but no new post-restart console error was recorded.
