# Blind Reference Comparison — Round 1

## Protocol

An isolated vision model received only two anonymous first-person shooter screenshots labelled **A** and **B**. It was instructed not to identify the source, was given no project history, and was asked to compare still-image presentation only. The model explicitly stated that movement, animation, game feel, physics, and gameplay capability cannot be assessed from a static frame.

## Outcome

The critic selected **Image B** by a large margin. Image A was Blacksite Protocol; Image B was a public Call of Duty gameplay frame. The critic rated Blacksite’s HUD as disciplined and readable, but judged its environment as blockout-like, its lighting as shallow, and its weapon and enemy silhouettes as under-detailed.

## Accepted Upgrade Contract

| Priority | Critic finding | Required implementation response |
|---|---|---|
| 1 | Floor, walls, and weapon read as flat | Strengthen PBR-like material response, wetness variation, specular highlights, surface decals, and weapon component detail. |
| 2 | Lighting lacks depth | Add clearer key/rim/fill structure, long-depth work-light pools, localized muzzle impact light, and more visible fog layers. |
| 3 | Environment appears sparse | Build stacked utility infrastructure, tactical cover variety, vertical machinery, warning panels, and asymmetrical lanes. |
| 4 | Enemy and weapon silhouettes feel generic | Expand procedural humanoid silhouettes, pose changes, gear readability, weapon rail/optic/muzzle details, and hit-react animation. |
| 5 | Still frame cannot assess movement | Improve sprint acceleration, camera bob, FOV transitions, recoil recovery, enemy strafe cadence, and provide a deterministic late-combat demo frame for visual proof. |

## Honest Limit

This workflow can produce a meaningful **blind still-image quality signal**, but it cannot prove parity with—or superiority over—a current AAA game’s full animation systems, asset library, physics, networking, or production budget. Its purpose is to expose the most visible gaps and drive a finite, technically feasible improvement cycle.

## Follow-up Rounds and Outcome

The critic was run again after the motion, viewmodel, operator-art, material, and depth passes. It still selected the public AAA reference for static rendering quality, while continuing to identify Blacksite’s HUD language as the stronger interface. The result is intentionally retained rather than reframed: the comparison shows that a browser-native original vertical slice with procedural geometry does not equal a current AAA title’s proprietary authored-model, material, animation, and lighting pipeline.

The implemented response is nevertheless concrete. Blacksite now has velocity-based movement, sprint FOV, stride camera motion, ADS, first-person handling sway, original operator art layered over differentiated procedural hostiles, varied enemy fire/strafe cadence, PBR-like floor and wall responses, generated utility/warning assets, dynamic shadow refresh, and late-combat deterministic capture behavior. These upgrades are verified in the live build, but do not change the critic’s honest AAA-quality finding.
