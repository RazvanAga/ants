import { describe, it, expect } from "vitest";
import { PheromoneField } from "./field.ts";

// A field big enough that the probed cells sit well away from the edges, so
// edge-replication doesn't confound the symmetry check.
const field = () => new PheromoneField(80, 80, 4); // 20x20 cells

describe("PheromoneField", () => {
  it("keeps its two channels independent", () => {
    const f = field();
    f.deposit("home", 40, 40, 0.5);
    expect(f.valueAt("home", 40, 40)).toBeCloseTo(0.5);
    expect(f.valueAt("food", 40, 40)).toBe(0);
  });

  describe("deposit", () => {
    it("raises the cell under the point", () => {
      const f = field();
      expect(f.valueAt("home", 40, 40)).toBe(0);
      f.deposit("home", 40, 40, 0.3);
      expect(f.valueAt("home", 40, 40)).toBeCloseTo(0.3);
    });

    it("is additive and clamps at the maximum", () => {
      const f = field();
      f.deposit("home", 40, 40, 0.7);
      f.deposit("home", 40, 40, 0.7);
      expect(f.valueAt("home", 40, 40)).toBe(1);
    });
  });

  describe("evaporation", () => {
    it("decays unrefreshed cells toward zero", () => {
      const f = field();
      f.deposit("home", 40, 40, 1);
      let prev = 1;
      for (let i = 0; i < 5; i++) {
        f.decayAndDiffuse(0.1, 0); // decay only, no diffusion
        const v = f.valueAt("home", 40, 40);
        expect(v).toBeLessThan(prev);
        prev = v;
      }
      for (let i = 0; i < 500; i++) f.decayAndDiffuse(0.1, 0);
      expect(f.valueAt("home", 40, 40)).toBeCloseTo(0, 5);
    });
  });

  describe("diffusion", () => {
    it("spreads symmetrically — no directional smear", () => {
      const f = field();
      const cx = 10;
      const cy = 10;
      f.deposit("home", cx * 4 + 2, cy * 4 + 2, 1); // raise the centre cell
      f.decayAndDiffuse(0, 0.5); // diffuse only, no decay

      const up = f.valueAtCell("home", cx, cy - 1);
      const down = f.valueAtCell("home", cx, cy + 1);
      const left = f.valueAtCell("home", cx - 1, cy);
      const right = f.valueAtCell("home", cx + 1, cy);

      expect(up).toBeGreaterThan(0);
      expect(down).toBeCloseTo(up, 12);
      expect(left).toBeCloseTo(up, 12);
      expect(right).toBeCloseTo(up, 12);
    });

    it("conserves total mass when there is no evaporation", () => {
      const f = field();
      f.deposit("home", 40, 40, 1);
      const total = () => f.home.reduce((s, v) => s + v, 0);
      const before = total();
      for (let i = 0; i < 50; i++) f.decayAndDiffuse(0, 0.25);
      expect(total()).toBeCloseTo(before, 5);
    });
  });
});
