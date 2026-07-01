import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";
import { PheromoneField } from "./field.ts";
import { spawnAnt, stepAnt, type AntStepContext } from "./ant.ts";
import { DEFAULT_PARAMS, type SimParams } from "./params.ts";
import { Prng } from "./prng.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

/** A step context on a blank field, so nothing an ant senses ever changes. */
function blankCtx(params: Partial<SimParams> = {}): AntStepContext {
  return {
    width: config.width,
    height: config.height,
    params: { ...DEFAULT_PARAMS, ...params },
    rng: new Prng(9),
    nest: { x: 160, y: 120 },
    field: new PheromoneField(config.width, config.height, config.cellSize),
  };
}

describe("give-up timer and escape-wander", () => {
  // Tiny thresholds so the mechanics are easy to step through by hand.
  const tuned = { giveUpTicks: 5, escapeDuration: 3 };

  it("enters an escape-wander only once the give-up threshold is exceeded", () => {
    const ctx = blankCtx(tuned);
    const ant = spawnAnt(ctx.nest, new Prng(1));

    // Under the threshold: still following normal rules, not escaping.
    for (let i = 0; i < tuned.giveUpTicks - 1; i++) {
      stepAnt(ant, ctx);
      expect(ant.escapeTicks).toBe(0);
    }

    // The step that reaches the threshold opens the escape window and resets the
    // clock, so escapes can't immediately chain into one another.
    stepAnt(ant, ctx);
    expect(ant.escapeTicks).toBeGreaterThan(0);
    expect(ant.ticksSinceGoal).toBe(0);
  });

  it("bounds the escape window, then resumes normal behaviour", () => {
    const ctx = blankCtx(tuned);
    const ant = spawnAnt(ctx.nest, new Prng(1));

    for (let i = 0; i < tuned.giveUpTicks; i++) stepAnt(ant, ctx); // trigger
    expect(ant.escapeTicks).toBeGreaterThan(0);

    // Run out the window; escapeDuration ticks of escape total, then back to 0.
    for (let i = 0; i < tuned.escapeDuration; i++) stepAnt(ant, ctx);
    expect(ant.escapeTicks).toBe(0);
  });

  it("re-triggers only after another full give-up interval, never chaining", () => {
    const ctx = blankCtx(tuned);
    const ant = spawnAnt(ctx.nest, new Prng(1));

    let escapesSeen = 0;
    let prev = 0;
    for (let i = 0; i < 40; i++) {
      stepAnt(ant, ctx);
      if (ant.escapeTicks > 0 && prev === 0) escapesSeen++;
      prev = ant.escapeTicks;
    }
    // Over 40 ticks with a 5-tick give-up + 3-tick escape (~8-tick cycle) an ant
    // that never reaches a goal escapes repeatedly — it keeps searching forever.
    expect(escapesSeen).toBeGreaterThan(2);
  });

  it("resets the clock when an ant reaches a goal", () => {
    // One ant, food right by the nest, so it reaches a goal quickly and we can
    // catch the clock at zero right after the pickup.
    const world = new World(config, 7, { ...DEFAULT_PARAMS, antCount: 1 });
    world.foodSources.length = 0;
    world.addFoodSource(world.nest.x + 10, world.nest.y, 5);

    let steps = 0;
    while (world.ants[0].state === "searching" && steps < 6000) {
      world.step();
      steps++;
    }
    expect(world.ants[0].state).toBe("carrying"); // reached food
    expect(world.ants[0].ticksSinceGoal).toBe(0); // clock reset at the goal
    expect(world.ants[0].escapeTicks).toBe(0);
  });

  it("keeps the colony searching with all food gone — no ant escapes the give-up net", () => {
    const params = { ...DEFAULT_PARAMS, giveUpTicks: 200, escapeDuration: 40 };
    const world = new World(config, 3, params);
    world.foodSources.length = 0; // nothing to find; ants must search forever

    for (let i = 0; i < 1000; i++) world.step(); // warm past the give-up threshold

    // A window longer than one full give-up cycle: with no goal to reset it, the
    // clock forces every single ant through an escape at least once — so none can
    // sit in a fixed orbit indefinitely.
    const window = params.giveUpTicks + params.escapeDuration + 200;
    const escaped = new Array(world.ants.length).fill(false);
    for (let i = 0; i < window; i++) {
      world.step();
      world.ants.forEach((a, idx) => {
        if (a.escapeTicks > 0) escaped[idx] = true;
      });
    }
    expect(escaped.every(Boolean)).toBe(true);

    // And the colony is genuinely out searching, not clumped at the nest.
    const maxFromNest = Math.max(
      ...world.ants.map((a) => Math.hypot(a.x - world.nest.x, a.y - world.nest.y)),
    );
    expect(maxFromNest).toBeGreaterThan(60);
  });
});
