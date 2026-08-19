# Blacksite Protocol — Design Exploration

## Three Candidate Directions

| Theme Name | Very Brief Intro | Probability |
|---|---|---:|
| Tungsten Rain | A rain-lashed blacksite raid built from wet concrete, tungsten work lamps, and surgical red threat markers. It treats combat as an intrusion through a living industrial machine. | 0.07 |
| Salt and Signal | A sun-bleached desert relay station rendered as a hostile field lab, with chalky mineral surfaces and broken antenna geometry. The tone is quiet, high-contrast, and tense rather than neon. | 0.04 |
| Furnace Doctrine | A deep geothermal extraction facility where tactical steel architecture meets orange furnace light and heavy airborne ash. The world is dense, oppressive, and heat-scarred. | 0.09 |

## Chosen Direction — Tungsten Rain

### Design Movement

**Cinematic tactical realism with industrial brutalism.** The playable slice depicts a covert breach into an underground rain-fed power facility, using a carefully authored high-contrast lighting design rather than trying to reproduce any particular commercial game or protected assets.

### Core Principles

1. **Readable threat silhouettes:** enemies, cover, interactables, and routes stay legible at speed even in a dark environment.
2. **Material storytelling:** every surface signals a function through wear, wetness, hazard paint, concrete aggregate, grating, or heat staining.
3. **Tactical compression:** the arena feels dense and layered, with flanking lanes, broken sightlines, and vertical industrial geometry.
4. **Physical feedback:** recoil, muzzle flashes, impacts, particles, hit markers, movement bob, and reactive lighting make each shot feel consequential.

### Color Philosophy

The image is principally **charcoal, wet blue-black concrete, desaturated steel, and fogged white work light**. The ownable accent is **Signal Vermilion (#E3482E)**, used sparingly for enemy identification, emergency panels, objective vectors, and damage communication. Warm light is an alarm signal; cool light establishes place and depth.

### Layout Paradigm

The space is an **asymmetric breach corridor** that opens into a turbine hall: a low starting canopy, a central flooded runway, a raised catwalk on the right, and a fractured utility bay on the left. The player advances through staggered cover rather than a symmetric arena, allowing the camera to discover composition through movement.

### Signature Elements

1. A severe **chevron breach mark** appears in the reticle, HUD, signage, and objective ray.
2. **Tungsten work-lamp pools** puncture a cold, wet darkness and catch rain, steam, and metallic dust.
3. **Signal Vermilion hazard language** unifies light strips, enemy optics, impact cues, and system warnings.

### Interaction Philosophy

The player should always feel in control but never weightless. Input is immediate; weapon cadence, camera kick, aim recovery, impact sparks, and enemy reactions communicate momentum without delaying control. The HUD is sparse and functional, preserving the environment as the primary interface.

### Animation

Weapon sway is subtle at idle, tightens while aiming, and delivers a compact upward-and-back recoil pulse on firing. Enemies use purposeful patrol, alert, strafe, hit-react, and collapse motions rather than idle loops. Steam, rain, drifting dust, sparks, and small warning-light flickers move slowly to build pressure. Reduced-motion settings should suppress nonessential camera and HUD motion.

### Typography System

Use **Barlow Condensed** for numeric, tactical, and HUD labels; use **IBM Plex Mono** for diagnostics and system telemetry. Titles are uppercase and tracked, information is arranged in short spatial clusters, and no UI uses generic default system typography as its visual voice.

### Brand Essence

**A visually dense, browser-native tactical breach shooter for players who value precise response and cinematic industrial atmosphere.** Personality: **disciplined, volatile, clandestine**.

### Brand Voice

Headlines are operational and compressed; CTAs describe a physical action; microcopy sounds like an internal system, not marketing.

> “BREACH THE LOWER ARRAY.”

> “HOSTILE SIGNALS MOVING THROUGH TURBINE BAY.”

### Wordmark & Logo

The mark is a bold, text-free **split chevron breach glyph**: two offset hard-edged wedges forming an inward vector, with a thin vermilion cut between them. The wordmark is custom-styled in compressed uppercase letterforms with a deliberate break in the “A”.

### Signature Brand Color

**Signal Vermilion — #E3482E.**

### Quality Bar

The objective is a **high-fidelity browser-game vertical slice**, not a claim of a complete AAA production or a side-by-side replacement for a proprietary title. The finished build must visibly provide a cohesive tactical environment, satisfying first-person controls, responsive shooting, enemy encounter behavior, atmospheric lighting, and a readable HUD. Screenshots and real gameplay will be used to find and repair visible weaknesses before handoff.

## Style Decisions

- Every gameplay frame preserves darkness while still revealing three distinct industrial layers: wet reflective floor, hard cover silhouette, and distant work-lamp depth.
- The split-chevron breach glyph is the primary brand mark. It appears in the header, start overlay, reticle/objective language, and environmental signage.
- Signal Vermilion (#E3482E) is reserved for breach actions, hostile signals, objective vectors, emergency panels, weapon impact cues, and system warnings.
