/**
 * Live-tunable colony parameters (PRD-01 → UI). Every value here is a starting
 * point, not a requirement — they get dialled in during the tuning slice (#11).
 * Structural params (grid resolution, world size) live on WorldConfig instead.
 */
export interface SimParams {
  /** Number of ants in the colony. */
  antCount: number;
  /** Forward travel per step, in display pixels. */
  speed: number;
  /** Hard cap on heading change per step, in radians (the max turn rate). */
  maxTurn: number;
  /** Magnitude of the per-step random wander turn, in radians. */
  wander: number;
  /** Distance from a wall at which ants begin steering away, in pixels. */
  wallMargin: number;
}

export const DEFAULT_PARAMS: SimParams = {
  antCount: 200,
  speed: 1,
  maxTurn: 0.35,
  wander: 0.3,
  wallMargin: 32,
};
