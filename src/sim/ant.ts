import type { Prng } from "./prng.ts";
import type { SimParams } from "./params.ts";
import type { Vec2 } from "./world.ts";

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
}

/** Context a single ant needs to update itself for one tick. */
export interface AntStepContext {
  width: number;
  height: number;
  params: SimParams;
  rng: Prng;
  nest: Vec2;
}

/** Spawn a searching ant at the nest with a randomised heading and full budget. */
export function spawnAnt(nest: Vec2, rng: Prng): Ant {
  return {
    x: nest.x,
    y: nest.y,
    heading: rng.next() * Math.PI * 2,
    state: "searching",
    budget: 1,
  };
}

/**
 * Advance one ant by a single tick. Searching ants wander; carrying ants steer
 * toward the nest by the homing vector (pheromone-following arrives in slice #6).
 * Either way, wall-avoidance steering overrides near the boundary, the turn is
 * capped at the max turn rate, then the ant moves forward and its budget decays
 * with the distance travelled. The ant is clamped inside the field.
 *
 * Exactly one PRNG draw happens per ant per tick regardless of state, so the
 * draw order — and therefore determinism — stays stable as ants change state.
 */
export function stepAnt(ant: Ant, ctx: AntStepContext): void {
  const { width, height, params, rng, nest } = ctx;

  const wanderTurn = (rng.next() * 2 - 1) * params.wander;

  let desired: number;
  if (ant.state === "carrying") {
    const toNest = Math.atan2(nest.y - ant.y, nest.x - ant.x);
    desired = wrapAngle(toNest - ant.heading);
  } else {
    desired = wanderTurn;
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
