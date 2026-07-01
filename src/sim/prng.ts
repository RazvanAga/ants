/**
 * Seeded PRNG (mulberry32) — the single source of all randomness in the sim.
 *
 * Determinism (see PRD-01 → Determinism) rests on this: a fixed seed replays the
 * exact same stream, so the same seed + layout + params reproduce a run. The
 * internal `state` is a plain uint32, so it serializes into a World snapshot and
 * lets a run be resumed or compared bit-for-bit.
 */
export class Prng {
  /** Internal mulberry32 state; a plain uint32 so it snapshots cleanly. */
  state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1), advancing the stream. */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
