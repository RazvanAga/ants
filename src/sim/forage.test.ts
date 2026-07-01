import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";
import { DEFAULT_PARAMS } from "./params.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

/** A world whose only food source sits a short hop from the nest. */
function worldWithNearbyFood(seed: number, crumbs = 50) {
  const world = new World(config, seed);
  world.foodSources.length = 0; // drop the default, control the layout
  world.addFoodSource(world.nest.x + 35, world.nest.y, crumbs);
  return world;
}

describe("forage loop", () => {
  it("closes the loop: food collected grows above zero", () => {
    const world = worldWithNearbyFood(123);
    for (let i = 0; i < 6000; i++) world.step();
    expect(world.foodCollected).toBeGreaterThan(0);
  });

  it("transitions searching → carrying on reaching food", () => {
    const world = worldWithNearbyFood(123);
    let sawCarrying = false;
    for (let i = 0; i < 6000 && !sawCarrying; i++) {
      world.step();
      sawCarrying = world.ants.some((a) => a.state === "carrying");
    }
    expect(sawCarrying).toBe(true);
  });

  it("depletes a food source to zero, removes it, and leaves ants searching", () => {
    const world = worldWithNearbyFood(7, 3);
    for (let i = 0; i < 12000; i++) world.step();

    expect(world.foodSources).toHaveLength(0); // removed at zero
    expect(world.foodCollected).toBeGreaterThan(0);
    expect(world.foodCollected).toBeLessThanOrEqual(3);
    // With no food left, every ant that arrives reverts to / stays searching.
    expect(world.ants.every((a) => a.state === "searching")).toBe(true);
  });

  it("takes exactly one crumb per ant per visit", () => {
    // A single ant, with food right beside the nest, so its first visit is the
    // only pickup that can happen when the crumb count first changes.
    const world = new World(config, 7, { ...DEFAULT_PARAMS, antCount: 1 });
    world.foodSources.length = 0;
    const source = world.addFoodSource(world.nest.x + 10, world.nest.y, 5);
    const start = source.crumbs;

    let steps = 0;
    while (source.crumbs === start && steps < 6000) {
      world.step();
      steps++;
    }

    expect(source.crumbs).toBe(start - 1);
    expect(world.ants[0].state).toBe("carrying");
  });

  describe("determinism", () => {
    it("same seed + layout reproduces identical foraging", () => {
      const a = worldWithNearbyFood(555);
      const b = worldWithNearbyFood(555);
      for (let i = 0; i < 4000; i++) {
        a.step();
        b.step();
      }
      expect(a.foodCollected).toBe(b.foodCollected);
      expect(a.snapshot()).toEqual(b.snapshot());
    });

    it("a changed seed diverges", () => {
      const a = worldWithNearbyFood(1);
      const b = worldWithNearbyFood(2);
      for (let i = 0; i < 4000; i++) {
        a.step();
        b.step();
      }
      expect(a.snapshot()).not.toEqual(b.snapshot());
    });
  });
});
