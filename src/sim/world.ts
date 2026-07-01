import { Prng } from "./prng.ts";
import { DEFAULT_PARAMS, type SimParams } from "./params.ts";
import { spawnAnt, stepAnt, type Ant } from "./ant.ts";
import { PheromoneField } from "./field.ts";

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
  ants: Ant[];
  /** Home / food pheromone channels, copied so the snapshot is a frozen view. */
  home: Float32Array;
  food: Float32Array;
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
  readonly params: SimParams;
  /** The colony's single home — pre-placed dead-centre on load. */
  readonly nest: Vec2;
  /** The colony, stored array-of-structs (PRD-01 → Stack & structure). */
  readonly ants: Ant[] = [];
  /** The two-channel pheromone field the colony coordinates through (ADR-0002). */
  readonly field: PheromoneField;
  tick = 0;

  /** All randomness flows from here; seeded so runs are reproducible. */
  private readonly prng: Prng;

  constructor(config: WorldConfig, seed: number, params: SimParams = DEFAULT_PARAMS) {
    this.config = config;
    this.seed = seed;
    this.params = params;
    this.prng = new Prng(seed);
    this.field = new PheromoneField(config.width, config.height, config.cellSize);
    this.nest = { x: config.width / 2, y: config.height / 2 };
    for (let i = 0; i < params.antCount; i++) {
      this.ants.push(spawnAnt(this.nest, this.prng));
    }
  }

  /**
   * Advance the world by one fixed timestep. Deterministic in
   * (state, params, seed). Currently: advance the clock, then move every ant.
   * Later slices extend the per-tick order to: sense-snapshot → move → deposit →
   * diffuse/evaporate, all drawing from `this.prng`.
   */
  step(): void {
    this.tick++;
    const ctx = {
      width: this.config.width,
      height: this.config.height,
      params: this.params,
      rng: this.prng,
    };

    // Per-tick order (PRD-01 → Pheromone field): (1) sense-snapshot + move,
    // (2) deposit, (3) diffuse/evaporate. Depositing after moving means an ant
    // never senses its own just-laid deposit in the same tick.
    for (const ant of this.ants) {
      stepAnt(ant, ctx);
    }

    for (const ant of this.ants) {
      // Deposit the pheromone for where the ant came from: searching ants (from
      // the nest) lay home pheromone. Carrying ants lay food pheromone (slice #5).
      if (ant.state === "searching") {
        this.field.deposit("home", ant.x, ant.y, this.params.depositStrength);
      }
    }

    this.field.decayAndDiffuse(this.params.evaporation, this.params.diffusion);
  }

  snapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      nest: { ...this.nest },
      ants: this.ants.map((a) => ({ ...a })),
      home: Float32Array.from(this.field.home),
      food: Float32Array.from(this.field.food),
      rngState: this.prng.state,
    };
  }
}
