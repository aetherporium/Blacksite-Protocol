export type GameMode = "briefing" | "active" | "paused" | "complete" | "failed";

export type HudSnapshot = {
  mode: GameMode;
  health: number;
  ammo: number;
  reserve: number;
  threats: number;
  objective: string;
  status: string;
  score: number;
  elapsed: number;
  hitMarker: boolean;
  damagePulse: number;
  reloading: boolean;
};

export type GameRuntimeOptions = {
  demo: boolean;
  onHud: (snapshot: HudSnapshot) => void;
};

export const INITIAL_HUD: HudSnapshot = {
  mode: "briefing",
  health: 100,
  ammo: 30,
  reserve: 120,
  threats: 3,
  objective: "BREACH THE LOWER ARRAY",
  status: "LINK STABLE",
  score: 0,
  elapsed: 0,
  hitMarker: false,
  damagePulse: 0,
  reloading: false,
};

export const ASSET_URLS = {
  visualTarget: "/manus-storage/blacksite-visual-target_fe181b70.png",
  wall: "/manus-storage/blacksite-wet-concrete-wall_c08d4f80.png",
  floor: "/manus-storage/blacksite-wet-floor_47e72a28.png",
  enemyReference: "/manus-storage/blacksite-enemy-reference_c815fcac.png",
  breachMark: "/manus-storage/blacksite-breach-mark_44d8de05.png",
} as const;
