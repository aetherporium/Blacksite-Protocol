/**
 * Tungsten Rain visual contract: this component is a transparent picture frame for the 3D scene.
 * The canvas must remain full-screen, unobstructed, and lifecycle-safe; HUD design lives in Home.
 */
import { useEffect, useRef, type MutableRefObject } from "react";
import { GameRuntime, type HudSnapshot } from "@/game";

type GameCanvasProps = {
  demo: boolean;
  onHud: (snapshot: HudSnapshot) => void;
  runtimeRef: MutableRefObject<GameRuntime | null>;
};

export default function GameCanvas({ demo, onHud, runtimeRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onHudRef = useRef(onHud);

  useEffect(() => {
    onHudRef.current = onHud;
  }, [onHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const runtime = new GameRuntime(canvas, {
      demo,
      onHud: (snapshot) => onHudRef.current(snapshot),
    });
    runtimeRef.current = runtime;

    return () => {
      runtimeRef.current = null;
      runtime.dispose();
    };
  }, [demo, runtimeRef]);

  return <canvas ref={canvasRef} className="game-canvas" aria-label="Blacksite Protocol first-person shooter" />;
}
