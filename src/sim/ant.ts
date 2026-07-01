import type { Prng } from "./prng.ts";
import type { SimParams } from "./params.ts";
import type { Vec2 } from "./world.ts";
import type { PheromoneField, Channel } from "./field.ts";

/** An ant is always in exactly one of two states (see docs/CONTEXT.md). */
export type AntState = "searching" | "carrying";

export interface Ant {
  x: number;
  y: number;
  /** Facing direction in radians. */
  heading: number;
  state: AntState;
  /**
   * Deposit budget, 1→0. Full at a goal, decays linearly to zero over the
   * "trail reach" distance travelled, so deposits are strongest near the goal —
   * this is what turns a stream of deposits into a usable gradient (PRD-01).
   */
  budget: number;
  /**
   * Ticks since this ant last reached a goal (pickup or delivery). Drives the
   * give-up timer: once it exceeds `giveUpTicks` the ant enters an escape-wander.
   */
  ticksSinceGoal: number;
  /** Remaining ticks of the current escape-wander window; 0 when not escaping. */
  escapeTicks: number;
}

/** Context a single ant needs to update itself for one tick. */
export interface AntStepContext {
  width: number;
  height: number;
  params: SimParams;
  rng: Prng;
  nest: Vec2;
  /** The shared pheromone field the ant senses to steer (read-only this phase). */
  field: PheromoneField;
}

/** Spawn a searching ant at the nest with a randomised heading and full budget. */
export function spawnAnt(nest: Vec2, rng: Prng): Ant {
  return {
    x: nest.x,
    y: nest.y,
    heading: rng.next() * Math.PI * 2,
    state: "searching",
    budget: 1,
    ticksSinceGoal: 0,
    escapeTicks: 0,
  };
}

/**
 * Advance one ant by a single tick. Both states steer by three forward sensors
 * (slice #6): a searching ant follows food pheromone toward food; a carrying ant
 * follows home pheromone toward the nest, with the homing vector demoted to a
 * weak fallback so it can't get lost when the trail has evaporated (ADR-0003).
 * An ant that has gone too long without reaching a goal gives up and enters a
 * bounded escape-wander (#7): it ignores pheromone and turns hard and randomly to
 * shake loose of whatever loop it was in, then resumes — this is also what keeps
 * a colony with no food searching forever instead of settling into fixed orbits.
 * Wall-avoidance overrides near the boundary, the turn is capped at the max turn
 * rate, then the ant moves forward and its budget decays with distance travelled.
 * The ant is clamped inside the field.
 *
 * Exactly one PRNG draw happens per ant per tick regardless of state, so the
 * draw order — and therefore determinism — stays stable as ants change state.
 */
export function stepAnt(ant: Ant, ctx: AntStepContext): void {
  const { width, height, params, rng, nest, field } = ctx;

  ant.ticksSinceGoal++;
  const raw = rng.next() * 2 - 1; // the single per-tick draw, used by every branch

  // Give up if it's been too long since a goal: open an escape-wander window and
  // reset the clock so windows can't chain back-to-back.
  if (ant.escapeTicks === 0 && ant.ticksSinceGoal >= params.giveUpTicks) {
    ant.escapeTicks = params.escapeDuration;
    ant.ticksSinceGoal = 0;
  }

  let desired: number;
  if (ant.escapeTicks > 0) {
    // Escape-wander: ignore pheromone entirely, turn hard and randomly.
    ant.escapeTicks--;
    desired = raw * params.escapeTurn;
  } else if (ant.state === "carrying") {
    const { turn, strength } = senseSteer(field, ant, "home", params);
    const homingTurn = wrapAngle(
      Math.atan2(nest.y - ant.y, nest.x - ant.x) - ant.heading,
    );
    // On a home trail: follow the sensors, nudged weakly nestward. Off it: the
    // homing vector is the whole steer, so a trail-less ant still gets home.
    desired =
      strength < params.senseThreshold
        ? homingTurn
        : turn + params.homingBias * homingTurn + raw * params.wander;
  } else {
    // Follow food pheromone toward food; wander keeps exploration alive and, on
    // a blank field, is the entire steer — the pre-trail wandering of slice #3.
    const { turn } = senseSteer(field, ant, "food", params);
    desired = turn + raw * params.wander;
  }

  const avoid = wallAvoidance(ant, width, height, params.wallMargin);
  const turn = clamp(
    avoid !== null ? wrapAngle(avoid - ant.heading) : desired,
    -params.maxTurn,
    params.maxTurn,
  );

  ant.heading = wrapAngle(ant.heading + turn);
  ant.x = clamp(ant.x + Math.cos(ant.heading) * params.speed, 0, width);
  ant.y = clamp(ant.y + Math.sin(ant.heading) * params.speed, 0, height);
  ant.budget = Math.max(0, ant.budget - params.speed / params.trailReach);
}

/**
 * The three-sensor steering rule. Three forward sensors — front-left, centre,
 * front-right at ±`sensorAngle` — each read a 3×3 averaged patch of `channel` a
 * fixed distance ahead. Returns the relative turn voting toward the strongest
 * sensor (`0` when the centre wins or all tie), and that strongest reading so a
 * caller can tell "on a trail" from "nothing sensed". Pure: no PRNG, no mutation.
 */
export function senseSteer(
  field: PheromoneField,
  ant: Ant,
  channel: Channel,
  params: SimParams,
): { turn: number; strength: number } {
  const { sensorDistance, sensorAngle } = params;
  const sample = (offset: number): number =>
    field.samplePatch(
      channel,
      ant.x + Math.cos(ant.heading + offset) * sensorDistance,
      ant.y + Math.sin(ant.heading + offset) * sensorDistance,
    );

  const left = sample(-sensorAngle);
  const centre = sample(0);
  const right = sample(sensorAngle);
  const strength = Math.max(left, centre, right);

  let turn = 0;
  if (centre >= left && centre >= right) turn = 0;
  else if (left >= right) turn = -sensorAngle;
  else turn = sensorAngle;

  return { turn, strength };
}

/**
 * Turn an ant toward a target heading by at most the max turn rate — used to
 * reorient believably toward its return direction when it reaches a goal.
 */
export function reorientToward(ant: Ant, targetHeading: number, maxTurn: number): void {
  const diff = wrapAngle(targetHeading - ant.heading);
  ant.heading = wrapAngle(ant.heading + clamp(diff, -maxTurn, maxTurn));
}

/**
 * The heading (radians) that points away from any nearby wall, or `null` if the
 * ant is clear of all walls. Contributions from each near edge grow linearly as
 * the ant approaches, so corners push diagonally inward.
 */
function wallAvoidance(
  ant: Ant,
  width: number,
  height: number,
  margin: number,
): number | null {
  let ax = 0;
  let ay = 0;

  if (ant.x < margin) ax += 1 - ant.x / margin;
  else if (ant.x > width - margin) ax -= 1 - (width - ant.x) / margin;

  if (ant.y < margin) ay += 1 - ant.y / margin;
  else if (ant.y > height - margin) ay -= 1 - (height - ant.y) / margin;

  if (ax === 0 && ay === 0) return null;
  return Math.atan2(ay, ax);
}

/** Wrap an angle into (-π, π]. */
function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
