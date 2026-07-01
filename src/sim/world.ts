import { Prng } from "./prng.ts";

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Structural parameters of the field. Hardcoded for v1 (see PRD-01 → UI);
 * changing them requires a fresh World.
 */
export interface WorldConfig {
  /** Field width in display pixels. */
  width: number;
  /** Field height in display pixels. */
  height: number;
  /** Pheromone-grid cell size in pixels — coarser than the display (ADR-0002). */
  cellSize: number;
}

/**
 * A comparable, plain-data view of all mutable simulation state. The determinism
 * test asserts on this, so anything that must replay identically belongs here.
 * As slices land (ants, pheromone fields) this snapshot grows with them.
 */
export interface WorldSnapshot {
  tick: number;
  nest: Vec2;
  /** Internal PRNG state — makes the snapshot sensitive to seed and to draws. */
  rngState: number;
}

/**
 * The headless simulation core (PRD-01 → Simulation core). Holds all world state
 * and advances it with a deterministic `step()`; it is usable without the DOM and
 * is the primary test seam. Rendering reads this but never mutates it.
 */
export class World {
  readonly config: WorldConfig;
  readonly seed: number;
  /** The colony's single home — pre-placed dead-centre on load. */
  readonly nest: Vec2;
  tick = 0;

  /** All randomness flows from here; seeded so runs are reproducible. */
  private readonly prng: Prng;

  constructor(config: WorldConfig, seed: number) {
    this.config = config;
    this.seed = seed;
    this.prng = new Prng(seed);
    this.nest = { x: config.width / 2, y: config.height / 2 };
  }

  /**
   * Advance the world by one fixed timestep. Deterministic in
   * (state, params, seed). The skeleton only advances the clock; later slices add
   * the per-tick order: sense-snapshot → move → deposit → diffuse/evaporate, all
   * drawing from `this.prng`.
   */
  step(): void {
    this.tick++;
  }

  snapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      nest: { ...this.nest },
      rngState: this.prng.state,
    };
  }
}
