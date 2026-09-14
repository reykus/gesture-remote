import { isFist, isPointing, mirrorHand, palmCenter, type Hand } from "./gestures";

export type GestureAction = "next" | "prev" | "blackout";

export type PointerState = {
  active: boolean;
  x: number; // smoothed, mirrored, 0..1
  y: number;
};

export type EngineCallbacks = {
  onNext: () => void;
  onPrev: () => void;
  onBlackoutToggle: () => void;
  /** Fired whenever an action triggers, for a transient on-screen toast. */
  onAction: (action: GestureAction) => void;
};

const SWIPE_WINDOW_MS = 500;
const SWIPE_MIN_DISTANCE = 0.15; // normalized width fraction — a shoulder-width-ish wave
const SWIPE_COOLDOWN_MS = 700;
const FIST_HOLD_MS = 800;
/** How long a hand can vanish (motion blur, edge of frame) before we give up on the in-progress gesture. */
const TRACKING_GRACE_MS = 400;
/** How long the fist must stay open before a new hold can trigger blackout again. */
const FIST_RELEASE_MS = 250;
const POINTER_SMOOTHING_HALFLIFE_MS = 60;

type TrailPoint = { x: number; t: number };

export class GestureEngine {
  pointer: PointerState = { active: false, x: 0.5, y: 0.5 };

  private targetX = 0.5;
  private targetY = 0.5;
  private trail: TrailPoint[] = [];
  private fistHoldStart: number | null = null;
  private fistArmed = true;
  private fistReleaseStart: number | null = null;
  private cooldownUntil = 0;
  private lastHandSeen = 0;

  reset() {
    this.pointer.active = false;
    this.trail = [];
    this.fistHoldStart = null;
    this.fistArmed = true;
    this.fistReleaseStart = null;
    this.lastHandSeen = 0;
  }

  update(hands: Hand[], now: number, callbacks: EngineCallbacks) {
    if (hands.length === 0) {
      // Don't nuke in-progress gestures on a single dropped frame — fast
      // swipes and motion blur routinely cause a few missed detections.
      if (now - this.lastHandSeen > TRACKING_GRACE_MS) {
        this.pointer.active = false;
        this.trail = [];
        this.fistHoldStart = null;
      }
      return;
    }
    this.lastHandSeen = now;

    const hand = mirrorHand(hands[0]);
    const fist = isFist(hand);
    const pointing = isPointing(hand);

    // --- Pointing: index-only extended finger moves a laser dot ---
    if (pointing) {
      const tip = hand[8];
      this.targetX = tip.x;
      this.targetY = tip.y;
      this.pointer.active = true;
    } else {
      this.pointer.active = false;
    }
    const smoothing = 1 - Math.pow(0.5, 16 / POINTER_SMOOTHING_HALFLIFE_MS);
    this.pointer.x += (this.targetX - this.pointer.x) * smoothing;
    this.pointer.y += (this.targetY - this.pointer.y) * smoothing;

    // --- Fist held ~0.8s toggles blackout ---
    // Re-arming requires an explicit release (hand open for a bit) so a
    // jittery detector can't fire the toggle twice in a row.
    if (fist) {
      this.fistReleaseStart = null;
      if (this.fistHoldStart === null) this.fistHoldStart = now;
      else if (this.fistArmed && now - this.fistHoldStart > FIST_HOLD_MS) {
        callbacks.onBlackoutToggle();
        callbacks.onAction("blackout");
        this.fistArmed = false;
        this.fistHoldStart = null;
      }
    } else {
      this.fistHoldStart = null;
      if (!this.fistArmed) {
        if (this.fistReleaseStart === null) this.fistReleaseStart = now;
        else if (now - this.fistReleaseStart > FIST_RELEASE_MS) {
          this.fistArmed = true;
          this.fistReleaseStart = null;
        }
      }
    }

    // --- Swipe navigates slides ---
    // Tracked for any hand shape that isn't a fist or the pointing pose, so
    // a swipe still registers even if fingers don't read as fully "open"
    // during fast motion (common with webcam motion blur).
    if (!fist && !pointing) {
      const x = palmCenter(hand).x;
      this.trail.push({ x, t: now });
      this.trail = this.trail.filter((p) => now - p.t < SWIPE_WINDOW_MS);

      if (now > this.cooldownUntil && this.trail.length > 2) {
        const first = this.trail[0];
        const last = this.trail[this.trail.length - 1];
        const dx = last.x - first.x;
        const elapsed = last.t - first.t;
        if (elapsed > 60 && Math.abs(dx) > SWIPE_MIN_DISTANCE) {
          if (dx > 0) {
            callbacks.onNext();
            callbacks.onAction("next");
          } else {
            callbacks.onPrev();
            callbacks.onAction("prev");
          }
          this.cooldownUntil = now + SWIPE_COOLDOWN_MS;
          this.trail = [];
        }
      }
    } else {
      this.trail = [];
    }
  }
}
