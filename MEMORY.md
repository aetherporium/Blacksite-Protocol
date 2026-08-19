# Production Memory

- Engine requirement: **Three.js**, per the brief. The game-dev workflow’s WebDev/asset/verification discipline is retained, while implementation adapts the canvas engine to Three.js.
- Delivery target: an original high-quality browser FPS vertical slice, not an unbounded or unprovable claim of AAA equivalence.
- Key visual reference: `ASSETS.md` contains the generated target frame and live asset URLs.
- High-risk features in this build: pointer lock, weapon timing, procedural enemy behavior, and lighting/performance.
- Capture strategy: `?demo` should automatically present the real encounter for screenshots; normal play must begin only from an explicit pointer-lock operation overlay.
- Verification completed on the final pass: `pnpm check` and `pnpm build` both succeed. The deterministic `?demo` view was visually captured after the final material, lighting, silhouette, and branding adjustments.
- Final atmosphere decision: exposure and fog were raised only enough to preserve dark tactical mood while making wet floor, cover, work-lamp depth, and hostiles legible. Signal Vermilion is confined to breach/action and threat information.
- Audio is browser-safe and synthesized with Web Audio. It remains silent until `ENTER OPERATION` or resume creates a user gesture, then supplies rifle, hit-confirm, and hostile fire cues without external media dependencies.
- Optimization pass: the Three.js runtime is dynamically imported after the static briefing layer is visible; rendering caps at device-pixel-ratio 1.35, static shadows are rendered only when invalidated, and rain density adapts to viewport area with updates throttled to 30 Hz. The production output now separates the initial application, Three.js runtime, and deferred `GameRuntime` chunks.
