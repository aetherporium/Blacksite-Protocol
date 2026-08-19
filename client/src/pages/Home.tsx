/**
 * Tungsten Rain visual contract: compressed tactical typography, asymmetric corner-cut panels,
 * cool industrial black with restrained Signal Vermilion feedback, never generic app chrome.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import GameCanvas from "@/components/GameCanvas";
import { ASSET_URLS, INITIAL_HUD, type HudSnapshot } from "@/game/types";
import type { GameRuntime } from "@/game/GameRuntime";

const formatTime = (seconds: number) => {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60).toString().padStart(2, "0");
  const remainder = (wholeSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${remainder}`;
};

export default function Home() {
  const runtimeRef = useRef<GameRuntime | null>(null);
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const demo = useMemo(() => new URLSearchParams(window.location.search).has("demo"), []);
  const [engineReady, setEngineReady] = useState(false);
  const updateHud = useCallback((snapshot: HudSnapshot) => setHud(snapshot), []);
  const handleEngineReady = useCallback(() => setEngineReady(true), []);
  const overlayVisible = !demo && ["briefing", "paused", "complete", "failed"].includes(hud.mode);
  const overlayHeading = hud.mode === "paused" ? "SIGNAL HOLD" : hud.mode === "complete" ? "ARRAY SECURED" : hud.mode === "failed" ? "LINK LOST" : "BLACKSITE PROTOCOL";
  const overlayDescription = hud.mode === "paused"
    ? "Pointer link interrupted. Resume to re-enter the lower turbine bay."
    : hud.mode === "complete"
      ? "Hostile signals cleared. The lower array is under your control."
      : hud.mode === "failed"
        ? "Operator telemetry terminated. Re-establish the breach link."
        : "Rain-fed turbine bay. Three hostile signals. Breach, clear, secure.";

  const activate = () => {
    if (!engineReady) return;
    if (hud.mode === "paused") runtimeRef.current?.resume();
    else if (hud.mode === "complete" || hud.mode === "failed") runtimeRef.current?.restart();
    else runtimeRef.current?.beginOperation();
  };

  return (
    <main className="game-shell">
      <div className="briefing-scene-still" style={{ backgroundImage: `url(${ASSET_URLS.visualTarget})` }} aria-hidden="true" />
      <GameCanvas demo={demo} onHud={updateHud} onReady={handleEngineReady} runtimeRef={runtimeRef} />
      <div className="atmosphere-vignette" aria-hidden="true" />
      <div className="atmosphere-grain" aria-hidden="true" />

      <section className={`hud-layer ${overlayVisible ? "hud-dim" : ""}`} aria-label="Combat telemetry">
        <div className="hud-topbar">
          <div className="brand-lockup">
            <img className="breach-mark" src={ASSET_URLS.breachMark} alt="" />
            <div>
              <p className="eyebrow">OPERATION // 04–D</p>
              <p className="wordmark">BL<span className="broken-a">A</span>CKSITE PROTOCOL</p>
            </div>
          </div>
          <div className="topbar-objective">
            <span className="objective-pip" />
            <span>{hud.objective}</span>
          </div>
          <div className="signal-status">
            <span className="signal-dot" />
            <span>{hud.status}</span>
          </div>
        </div>

        <div className="hud-side-telemetry">
          <div className="telemetry-row"><span>THREAT GRID</span><strong>{String(hud.threats).padStart(2, "0")}</strong></div>
          <div className="telemetry-row"><span>BREACH TIME</span><strong>{formatTime(hud.elapsed)}</strong></div>
          <div className="telemetry-row"><span>TRACE</span><strong>{String(hud.score).padStart(4, "0")}</strong></div>
        </div>

        <div className="crosshair" aria-hidden="true">
          <i /><i /><i /><i />
          {hud.hitMarker && <b className="hit-marker">×</b>}
        </div>

        <div className="hud-bottom">
          <div className={`vital-card ${hud.damagePulse > 0 ? "critical" : ""}`}>
            <div className="vital-label"><span>VITALS</span><span>{Math.ceil(hud.health)}%</span></div>
            <div className="vital-track"><span style={{ width: `${hud.health}%` }} /></div>
            <p>OPERATIVE SIGNAL</p>
          </div>
          <div className="instruction-strip">
            <span>WASD</span> MOVE <span>SPACE</span> JUMP <span>CTRL</span> CROUCH <span>SHIFT</span> SPRINT <span>RMB</span> AIM <span>R</span> RELOAD <span>LMB</span> FIRE
          </div>
          <div className={`ammo-card ${hud.reloading ? "reloading" : ""}`}>
            <div><span>AR-9 // TUNGSTEN</span><small>{hud.reloading ? "CHAMBERING" : "LIVE"}</small></div>
            <strong>{String(hud.ammo).padStart(2, "0")}</strong>
            <em>/ {String(hud.reserve).padStart(3, "0")}</em>
          </div>
        </div>
      </section>

      {overlayVisible && (
        <section className="operation-overlay" role="dialog" aria-label={overlayHeading}>
          <div className="operation-panel">
            <div className="panel-edge-code">NODE 04 / HYDRO ARRAY / SECURE CHANNEL</div>
            <div className="operation-content">
              <div className="operation-copy">
                <div className="hero-glyph" aria-hidden="true">
                  <img src={ASSET_URLS.breachMark} alt="" />
                  <span className="glyph-wing glyph-wing-left" />
                  <span className="glyph-wing glyph-wing-right" />
                </div>
                <div className="operation-kicker"><span /> LIVE SIMULATION</div>
                <h1>{overlayHeading === "BLACKSITE PROTOCOL" ? <>BL<span className="broken-a">A</span>CKSITE<br />PROTOCOL</> : overlayHeading}</h1>
                <p>{overlayDescription}</p>
                <button className="enter-button" type="button" onClick={activate} disabled={!engineReady}>
                  <span>{!engineReady ? "CALIBRATING NODE" : hud.mode === "paused" ? "RESUME BREACH" : hud.mode === "complete" || hud.mode === "failed" ? "RE-INITIALIZE" : "ENTER OPERATION"}</span>
                  <b>↗</b>
                </button>
                <div className="control-legend">
                  <span><b>01</b> Precise first-person movement</span>
                  <span><b>02</b> Automatic rifle / hit-scan combat</span>
                  <span><b>03</b> Clear three hostile signals</span>
                </div>
              </div>
              <div className="target-card">
                <img src={ASSET_URLS.visualTarget} alt="Operational visual target for the flooded turbine bay" />
                <div className="target-card-caption"><span>CAMERA FEED</span><span>04:02:17</span></div>
              </div>
            </div>
            <div className="breach-architecture" aria-hidden="true"><span /><span /><span /></div>
            <div className="panel-footnote">SYSTEM NOTICE — USER GESTURE ENABLES AIM LINK. PRESS ESCAPE TO PAUSE.</div>
          </div>
        </section>
      )}

      {hud.damagePulse > 0 && <div className="damage-flash" style={{ opacity: hud.damagePulse * 0.42 }} aria-hidden="true" />}
      {demo && <div className="demo-tag">AUTONOMOUS VISUAL CHECK // LIVE ENCOUNTER</div>}
    </main>
  );
}
