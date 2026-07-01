import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

describe("placement tools", () => {
  it("place-nest moves the single nest to the clicked point", () => {
    const world = new World(config, 1);
    world.moveNest(40, 50);
    expect(world.nest).toEqual({ x: 40, y: 50 });
  });

  it("place-nest keeps the nest inside the field", () => {
    const world = new World(config, 1);
    world.moveNest(-20, config.height + 100);
    expect(world.nest.x).toBeGreaterThanOrEqual(0);
    expect(world.nest.y).toBeLessThanOrEqual(config.height);
  });

  it("add-food creates a source of the given size at the point", () => {
    const world = new World(config, 1);
    const before = world.foodSources.length;
    const source = world.addFoodSource(80, 90, 123);
    expect(world.foodSources).toHaveLength(before + 1);
    expect(source).toMatchObject({ x: 80, y: 90, crumbs: 123 });
  });

  describe("erase", () => {
    it("removes a food source under the cursor", () => {
      const world = new World(config, 1);
      world.foodSources.length = 0;
      world.addFoodSource(100, 100, 50);
      world.eraseAt(100, 100);
      expect(world.foodSources).toHaveLength(0);
    });

    it("clears both pheromone channels under the cursor", () => {
      const world = new World(config, 1);
      world.field.deposit("food", 100, 100, 1);
      world.field.deposit("home", 100, 100, 1);
      expect(world.field.valueAt("food", 100, 100)).toBeGreaterThan(0);

      world.eraseAt(100, 100);
      expect(world.field.valueAt("food", 100, 100)).toBe(0);
      expect(world.field.valueAt("home", 100, 100)).toBe(0);
    });

    it("leaves sources outside its radius untouched", () => {
      const world = new World(config, 1);
      world.foodSources.length = 0;
      world.addFoodSource(100, 100, 50);
      world.eraseAt(220, 180);
      expect(world.foodSources).toHaveLength(1);
    });
  });
});
