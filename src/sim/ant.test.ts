import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";

const config: WorldConfig = { width: 320, height: 240, cellSize: 4 };

describe("wandering ants", () => {
  it("spawns the whole colony at the nest, searching, with varied headings", () => {
    const world = new World(config, 7);
    expect(world.ants).toHaveLength(world.params.antCount);
    for (const ant of world.ants) {
      expect(ant.state).toBe("searching");
      expect(ant.x).toBe(world.nest.x);
      expect(ant.y).toBe(world.nest.y);
    }
    const headings = new Set(world.ants.map((a) => a.heading));
    expect(headings.size).toBeGreaterThan(1);
  });

  it("keeps every ant within the field bounds after many steps", () => {
    const world = new World(config, 7);
    for (let i = 0; i < 2000; i++) world.step();
    for (const ant of world.ants) {
      expect(ant.x).toBeGreaterThanOrEqual(0);
      expect(ant.x).toBeLessThanOrEqual(config.width);
      expect(ant.y).toBeGreaterThanOrEqual(0);
      expect(ant.y).toBeLessThanOrEqual(config.height);
    }
  });

  it("actually moves ants off the nest (it is not a no-op)", () => {
    const world = new World(config, 7);
    for (let i = 0; i < 100; i++) world.step();
    const moved = world.ants.some(
      (a) => a.x !== world.nest.x || a.y !== world.nest.y,
    );
    expect(moved).toBe(true);
  });

  it("produces identical ant positions for a fixed seed", () => {
    const a = new World(config, 4242);
    const b = new World(config, 4242);
    for (let i = 0; i < 300; i++) {
      a.step();
      b.step();
    }
    expect(a.snapshot().ants).toEqual(b.snapshot().ants);
  });

  it("diverges for a different seed", () => {
    const a = new World(config, 1);
    const b = new World(config, 2);
    for (let i = 0; i < 300; i++) {
      a.step();
      b.step();
    }
    expect(a.snapshot().ants).not.toEqual(b.snapshot().ants);
  });
});
