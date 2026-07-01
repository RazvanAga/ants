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
  /** Fraction of pheromone lost per tick (evaporation); retention is 1 − this. */
  evaporation: number;
  /** How strongly each cell blends toward its neighbours' average per tick, 0–1. */
  diffusion: number;
  /** Pheromone added to the current cell per depositing ant per tick, at full budget. */
  depositStrength: number;
  /** Distance at which a searching ant directly detects a food source, in pixels. */
  sniffRadius: number;
  /** Distance over which an ant's deposit budget fades from full to zero, in pixels. */
  trailReach: number;
  /** How far ahead the three steering sensors sample the field, in pixels. */
  sensorDistance: number;
  /** Angular offset of the left/right sensors from the ant's heading, in radians. */
  sensorAngle: number;
  /**
   * Minimum strongest-sensor reading for a carrying ant to trust the home trail.
   * Below it, the ant falls back to the homing vector so it can't get lost when
   * the trail has evaporated (ADR-0003).
   */
  senseThreshold: number;
  /**
   * Weight of the weak homing-vector bias blended in while a carrying ant is
   * following a home trail — keeps it drifting nestward without overriding the
   * trail it's on.
   */
  homingBias: number;
}

export const DEFAULT_PARAMS: SimParams = {
  antCount: 200,
  speed: 1,
  maxTurn: 0.35,
  wander: 0.3,
  wallMargin: 32,
  evaporation: 0.02,
  diffusion: 0.12,
  depositStrength: 0.2,
  sniffRadius: 15,
  trailReach: 120,
  sensorDistance: 12,
  sensorAngle: 0.6,
  senseThreshold: 0.02,
  homingBias: 0.3,
};
