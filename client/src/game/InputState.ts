import type { GameMode } from "./types";

type SemanticAction = "forward" | "back" | "left" | "right" | "sprint";

const KEY_TO_ACTION: Record<string, SemanticAction | undefined> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  ShiftLeft: "sprint",
  ShiftRight: "sprint",
};

/** Input is centralized so gameplay systems never inspect raw browser key events. */
export class InputState {
  private actions = new Set<SemanticAction>();
  private reloadRequested = false;
  private pauseRequested = false;
  private firing = false;

  private onKeyDown = (event: KeyboardEvent) => {
    const action = KEY_TO_ACTION[event.code];
    if (action) {
      this.actions.add(action);
      event.preventDefault();
    }
    if (event.code === "KeyR" && !event.repeat) {
      this.reloadRequested = true;
      event.preventDefault();
    }
    if (event.code === "Escape") this.pauseRequested = true;
  };

  private onKeyUp = (event: KeyboardEvent) => {
    const action = KEY_TO_ACTION[event.code];
    if (action) {
      this.actions.delete(action);
      event.preventDefault();
    }
  };

  private onMouseDown = (event: MouseEvent) => {
    if (event.button === 0) this.firing = true;
  };

  private onMouseUp = (event: MouseEvent) => {
    if (event.button === 0) this.firing = false;
  };

  private onContextMenu = (event: MouseEvent) => event.preventDefault();

  constructor(private canvas: HTMLCanvasElement) {
    window.addEventListener("keydown", this.onKeyDown, { passive: false });
    window.addEventListener("keyup", this.onKeyUp, { passive: false });
    window.addEventListener("mousedown", this.onMouseDown);
    window.addEventListener("mouseup", this.onMouseUp);
    canvas.addEventListener("contextmenu", this.onContextMenu);
  }

  isPressed(action: SemanticAction) {
    return this.actions.has(action);
  }

  isFiring(mode: GameMode) {
    return mode === "active" && this.firing;
  }

  consumeReload() {
    const requested = this.reloadRequested;
    this.reloadRequested = false;
    return requested;
  }

  consumePause() {
    const requested = this.pauseRequested;
    this.pauseRequested = false;
    return requested;
  }

  clear() {
    this.actions.clear();
    this.firing = false;
  }

  dispose() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("mousedown", this.onMouseDown);
    window.removeEventListener("mouseup", this.onMouseUp);
    this.canvas.removeEventListener("contextmenu", this.onContextMenu);
  }
}
