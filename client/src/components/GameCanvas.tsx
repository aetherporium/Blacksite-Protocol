/**
 * Tungsten Rain visual contract: this component is a transparent picture frame for the 3D scene.
 * The canvas must remain full-screen, unobstructed, and lifecycle-safe; HUD design lives in Home.
 */
import { useEffect, useRef, type MutableRefObject } from "react";
import type { GameRuntime, HudSnapshot } from "@/game";

type GameCanvasProps = {
  demo: boolean;
  onHud: (snapshot: HudSnapshot) => void;
  onReady: () => void;
  runtimeRef: MutableRefObject<GameRuntime | null>;
};

export default function GameCanvas({ demo, onHud, onReady, runtimeRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onHudRef = useRef(onHud);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onHudRef.current = onHud;
  }, [onHud]);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let runtime: GameRuntime | null = null;
    let cancelled = false;
    const loadDelay = window.setTimeout(() => {
      void import("@/game/GameRuntime").then(({ GameRuntime: Runtime }) => {
        if (cancelled) return;
        runtime = new Runtime(canvas, {
          demo,
          onHud: (snapshot) => onHudRef.current(snapshot),
        });
        runtimeRef.current = runtime;
        onReadyRef.current();
      });
    }, demo ? 0 : 350);

    return () => {
      cancelled = true;
      window.clearTimeout(loadDelay);
      runtimeRef.current = null;
      runtime?.dispose();
    };
  }, [demo, runtimeRef]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Blacksite Protocol first-person shooter" />;
}
