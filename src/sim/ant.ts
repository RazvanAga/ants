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
}

/** Context a single ant needs to update itself for one tick. */
export interface AntStepContext {
  width: number;
  height: number;
  params: SimParams;
  rng: Prng;
}

/** Spawn a searching ant at the nest with a randomised heading. */
export function spawnAnt(nest: Vec2, rng: Prng): Ant {
  return {
    x: nest.x,
    y: nest.y,
    heading: rng.next() * Math.PI * 2,
    state: "searching",
  };
}

/**
 * Advance one ant by a single tick: a bounded random wander, overridden by
 * wall-avoidance steering near the boundary, then forward motion. The ant is
 * clamped inside the field as a hard guarantee that the colony stays on screen.
 *
 * Exactly one PRNG draw happens per ant per tick regardless of branch, so the
 * draw order — and therefore determinism — is stable.
 */
export function stepAnt(ant: Ant, ctx: AntStepContext): void {
  const { width, height, params, rng } = ctx;

  const wanderTurn = (rng.next() * 2 - 1) * params.wander;
  const avoid = wallAvoidance(ant, width, height, params.wallMargin);

  let turn: number;
  if (avoid) {
    // Near a wall, steering away takes precedence over the wander.
    turn = clamp(wrapAngle(avoid - ant.heading), -params.maxTurn, params.maxTurn);
  } else {
    turn = clamp(wanderTurn, -params.maxTurn, params.maxTurn);
  }

  ant.heading = wrapAngle(ant.heading + turn);
  ant.x = clamp(ant.x + Math.cos(ant.heading) * params.speed, 0, width);
  ant.y = clamp(ant.y + Math.sin(ant.heading) * params.speed, 0, height);
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
