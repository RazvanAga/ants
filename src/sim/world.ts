import { Prng } from "./prng.ts";
import { DEFAULT_PARAMS, type SimParams } from "./params.ts";
import { spawnAnt, stepAnt, reorientToward, type Ant } from "./ant.ts";
import { PheromoneField } from "./field.ts";
import { makeFoodSource, type FoodSource } from "./food.ts";

export interface Vec2 {
  x: number;
  y: number;
}

/** How close a carrying ant must get to the nest to deliver its crumb, in pixels. */
const DELIVERY_RADIUS = 8;

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
  foodSources: FoodSource[];
  foodCollected: number;
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
  /** Placed, depletable food sources; removed when their last crumb is taken. */
  readonly foodSources: FoodSource[] = [];
  /** Running tally of crumbs delivered to the nest — the colony's yield. */
  foodCollected = 0;
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
    // A default food source, offset from the nest so the colony has something to
    // discover the instant the app opens (PRD-01 → Further Notes). Position and
    // crumb count are starting points, dialled in during #11.
    this.addFoodSource(
      this.nest.x + config.width * 0.22,
      this.nest.y - config.height * 0.18,
      200,
    );
  }

  /** Place a food source with the given crumb count (public op; see PRD-01). */
  addFoodSource(x: number, y: number, crumbs: number): FoodSource {
    const source = makeFoodSource(x, y, crumbs);
    this.foodSources.push(source);
    return source;
  }

  /**
   * Advance the world by one fixed timestep. Deterministic in
   * (state, params, seed). Per-tick order (PRD-01 → Pheromone field):
   * (1) sense-snapshot + move, (2) resolve goal interactions, (3) deposit,
   * (4) diffuse/evaporate. Depositing after moving means an ant never senses its
   * own just-laid deposit in the same tick.
   */
  step(): void {
    this.tick++;
    const ctx = {
      width: this.config.width,
      height: this.config.height,
      params: this.params,
      rng: this.prng,
      nest: this.nest,
      field: this.field,
    };

    for (const ant of this.ants) {
      stepAnt(ant, ctx);
    }

    for (const ant of this.ants) {
      if (ant.state === "searching") this.tryPickUp(ant);
      else this.tryDeliver(ant);
    }

    for (const ant of this.ants) {
      // Deposit the pheromone for where the ant came *from*, scaled by the
      // fading budget so trails form a gradient: searching ants (from the nest)
      // lay home pheromone; carrying ants (from food) lay food pheromone.
      const channel = ant.state === "searching" ? "home" : "food";
      this.field.deposit(channel, ant.x, ant.y, this.params.depositStrength * ant.budget);
    }

    this.field.decayAndDiffuse(this.params.evaporation, this.params.diffusion);
  }

  /**
   * A searching ant within the sniff radius of a food source takes one crumb,
   * switches to carrying, refills its budget, and reorients toward home. The
   * source is removed when its last crumb is taken.
   */
  private tryPickUp(ant: Ant): void {
    const source = this.nearestFoodInSniff(ant);
    if (!source) return;

    source.crumbs--;
    ant.state = "carrying";
    ant.budget = 1;
    ant.ticksSinceGoal = 0; // reached a goal — reset the give-up clock (#7)
    ant.escapeTicks = 0;
    reorientToward(
      ant,
      Math.atan2(this.nest.y - ant.y, this.nest.x - ant.x),
      this.params.maxTurn,
    );

    if (source.crumbs <= 0) {
      this.foodSources.splice(this.foodSources.indexOf(source), 1);
    }
  }

  /**
   * A carrying ant within the delivery radius of the nest delivers its crumb:
   * food collected increments, it reverts to searching, refills its budget, and
   * reorients outward to explore again — closing the forage loop.
   */
  private tryDeliver(ant: Ant): void {
    if (distance(ant, this.nest) > DELIVERY_RADIUS) return;

    this.foodCollected++;
    ant.state = "searching";
    ant.budget = 1;
    ant.ticksSinceGoal = 0; // reached a goal — reset the give-up clock (#7)
    ant.escapeTicks = 0;
    reorientToward(
      ant,
      Math.atan2(ant.y - this.nest.y, ant.x - this.nest.x),
      this.params.maxTurn,
    );
  }

  private nearestFoodInSniff(ant: Ant): FoodSource | null {
    let best: FoodSource | null = null;
    let bestDist = this.params.sniffRadius;
    for (const source of this.foodSources) {
      if (source.crumbs <= 0) continue;
      const d = distance(ant, source);
      if (d <= bestDist) {
        best = source;
        bestDist = d;
      }
    }
    return best;
  }

  snapshot(): WorldSnapshot {
    return {
      tick: this.tick,
      nest: { ...this.nest },
      ants: this.ants.map((a) => ({ ...a })),
      foodSources: this.foodSources.map((s) => ({ ...s })),
      foodCollected: this.foodCollected,
      home: Float32Array.from(this.field.home),
      food: Float32Array.from(this.field.food),
      rngState: this.prng.state,
    };
  }
}

function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
