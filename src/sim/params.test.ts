import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";
import { DEFAULT_PARAMS } from "./params.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

describe("live parameter changes (#10)", () => {
  describe("ant-count slider", () => {
    it("spawns fresh searching ants at the nest when raised", () => {
      const world = new World(config, 1);
      world.setAntCount(0);
      world.setAntCount(5);
      expect(world.ants).toHaveLength(5);
      expect(world.params.antCount).toBe(5);
      for (const ant of world.ants) {
        expect(ant.state).toBe("searching");
        expect(ant).toMatchObject({ x: world.nest.x, y: world.nest.y });
      }
    });

    it("removes the surplus when lowered", () => {
      const world = new World(config, 1);
      world.setAntCount(50);
      world.setAntCount(3);
      expect(world.ants).toHaveLength(3);
      expect(world.params.antCount).toBe(3);
    });

    it("never goes below zero", () => {
      const world = new World(config, 1);
      world.setAntCount(-10);
      expect(world.ants).toHaveLength(0);
      expect(world.params.antCount).toBe(0);
    });
  });

  describe("behavioural params take effect live", () => {
    it("a changed parameter changes step output", () => {
      // Two identical worlds, each with its own params so mutating one is
      // isolated; change a param on the second between snapshots.
      const baseline = new World(config, 12345, { ...DEFAULT_PARAMS });
      const tweaked = new World(config, 12345, { ...DEFAULT_PARAMS });
      for (let i = 0; i < 50; i++) {
        baseline.step();
        tweaked.step();
      }
      expect(tweaked.snapshot()).toEqual(baseline.snapshot());

      // A different evaporation rate must diverge the pheromone field from here.
      tweaked.params.evaporation = baseline.params.evaporation + 0.05;
      for (let i = 0; i < 50; i++) {
        baseline.step();
        tweaked.step();
      }
      expect(tweaked.snapshot()).not.toEqual(baseline.snapshot());
    });
  });
});
