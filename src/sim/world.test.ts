import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";

const config: WorldConfig = {
  width: 320,
  height: 240,
  cellSize: 4,
};

describe("World", () => {
  it("pre-places a single nest dead-centre on load, usable without the DOM", () => {
    const world = new World(config, 42);
    expect(world.nest).toEqual({ x: 160, y: 120 });
    expect(world.tick).toBe(0);
  });

  it("carries its seed", () => {
    expect(new World(config, 42).seed).toBe(42);
  });

  it("advances one fixed timestep per step()", () => {
    const world = new World(config, 42);
    world.step();
    world.step();
    world.step();
    expect(world.tick).toBe(3);
  });

  describe("determinism", () => {
    it("same seed + same steps produce identical state", () => {
      const a = new World(config, 12345);
      const b = new World(config, 12345);
      for (let i = 0; i < 500; i++) {
        a.step();
        b.step();
      }
      expect(a.snapshot()).toEqual(b.snapshot());
    });

    it("a changed seed produces different state", () => {
      const a = new World(config, 12345);
      const b = new World(config, 99999);
      for (let i = 0; i < 500; i++) {
        a.step();
        b.step();
      }
      expect(a.snapshot()).not.toEqual(b.snapshot());
    });
  });
});
