import { describe, it, expect } from "vitest";
import { Prng } from "./prng.ts";

describe("Prng (mulberry32)", () => {
  it("produces floats in [0, 1)", () => {
    const rng = new Prng(1);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = new Prng(12345);
    const b = new Prng(12345);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = new Prng(1);
    const b = new Prng(2);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it("exposes serializable internal state that resumes the stream", () => {
    const a = new Prng(777);
    a.next();
    a.next();
    const savedState = a.state;
    const continued = a.next();

    const restored = new Prng(0);
    restored.state = savedState;
    expect(restored.next()).toEqual(continued);
  });
});
