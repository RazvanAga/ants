/**
 * Live-tunable colony parameters (PRD-01 → UI). The DEFAULT_PARAMS values below
 * were dialled in during the tuning slice (#11), then re-tuned via headless
 * benchmark sweeps: verified across seeds to give reliable discovery, bold trail
 * formation, sharpening and fade, connected trails to food placed anywhere on
 * the field (trailReach must span nest↔food, not just the opening source), and
 * post-depletion dispersal. Still fully live-tunable via the sliders — these are
 * just the out-of-the-box starting point.
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
   * Minimum strongest-sensor reading for a *searching* ant to trust the food
   * trail. Below it the ant ignores the gradient and wanders, so it can't be
   * steered by the near-zero *ghost* of an exhausted trail (which decays toward
   * zero but never reaches it) and pinned orbiting a dead food site. Much lower
   * than `senseThreshold`: a real recruitment trail's faint tail must still pull
   * ants in, so this only rejects the diffusion floor left after depletion.
   */
  foodSenseFloor: number;
  /**
   * Weight of the weak homing-vector bias blended in while a carrying ant is
   * following a home trail — keeps it drifting nestward without overriding the
   * trail it's on.
   */
  homingBias: number;
  /**
   * Ticks an ant may go without reaching a goal before it gives up and enters an
   * escape-wander. Also what keeps a colony with no food searching forever (#7).
   */
  giveUpTicks: number;
  /** Length of an escape-wander window once triggered, in ticks. */
  escapeDuration: number;
  /**
   * Random turn magnitude during escape-wander — larger than `wander` so the ant
   * turns hard and breaks out of the loop it was stuck in.
   */
  escapeTurn: number;
}

/** The tuned, verified defaults (#11, benchmark re-tune). Live-editable through the sliders. */
export const DEFAULT_PARAMS: SimParams = {
  antCount: 200,
  speed: 1,
  maxTurn: 0.35,
  wander: 0.2,
  wallMargin: 32,
  evaporation: 0.02,
  diffusion: 0.12,
  depositStrength: 0.3,
  sniffRadius: 15,
  trailReach: 240,
  sensorDistance: 16,
  sensorAngle: 0.45,
  senseThreshold: 0.02,
  foodSenseFloor: 0.00001,
  homingBias: 0.3,
  giveUpTicks: 800,
  escapeDuration: 60,
  escapeTurn: 1.0,
};
