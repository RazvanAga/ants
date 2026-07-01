import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";
import type { Channel } from "./field.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

/**
 * A colony with a single food source a clear hop due east of the nest, so the
 * nest→food corridor is the horizontal segment y = nest.y between the two. The
 * source is stocked far beyond what the run can eat, so a trail that forms stays
 * refreshed instead of vanishing when the last crumb is taken.
 */
function corridorWorld(seed: number) {
  const world = new World(config, seed);
  world.foodSources.length = 0;
  const food = { x: world.nest.x + 60, y: world.nest.y };
  world.addFoodSource(food.x, food.y, 20000);
  return { world, food };
}

/** Mean of a channel sampled at evenly spaced points along a horizontal segment. */
function meanAlong(
  world: World,
  ch: Channel,
  x0: number,
  x1: number,
  y: number,
  samples = 9,
): number {
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const x = x0 + ((x1 - x0) * i) / (samples - 1);
    sum += world.field.valueAt(ch, x, y);
  }
  return sum / samples;
}

describe("emergent trail formation", () => {
  it("raises food pheromone along the nest→food corridor vs off to the side", () => {
    const { world, food } = corridorWorld(2024);
    for (let i = 0; i < 8000; i++) world.step();

    // Sample strictly between nest and food so we measure the trail, not the
    // deposit blobs sitting on the endpoints themselves.
    const x0 = world.nest.x + 12;
    const x1 = food.x - 12;
    const onCorridor = meanAlong(world, "food", x0, x1, world.nest.y);
    const offCorridor = meanAlong(world, "food", x0, x1, world.nest.y + 40);

    // A real ridge of food pheromone, not numerical noise above the background.
    expect(onCorridor).toBeGreaterThan(0.1);
    expect(onCorridor).toBeGreaterThan(offCorridor * 5);
  });

  it("keeps foraging productive once a trail exists", () => {
    const { world } = corridorWorld(2024);
    for (let i = 0; i < 8000; i++) world.step();
    // Once the trail ignites the colony exploits it hard — far more than the
    // trickle a pure random-wander search brings home.
    expect(world.foodCollected).toBeGreaterThan(500);
  });

  it("still reproduces identically for a fixed seed with sensing active", () => {
    const a = corridorWorld(77).world;
    const b = corridorWorld(77).world;
    for (let i = 0; i < 3000; i++) {
      a.step();
      b.step();
    }
    expect(a.snapshot()).toEqual(b.snapshot());
  });
});
