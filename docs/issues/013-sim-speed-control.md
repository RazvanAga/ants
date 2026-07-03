Issue: https://github.com/RazvanAga/ants/issues/13

## What to build

A speed selector in the controls bar that fast-forwards the simulation at 1x, 2x, 4x, or 8x. The fixed-timestep loop already decouples stepping from rendering, so speed is a multiplier on elapsed time fed into the accumulator — the step size itself must not change, which preserves determinism: a run at 8x passes through exactly the same states as at 1x, just faster on the wall clock.

Watching a trail sharpen or a far source drain currently takes minutes of real time; this is the single biggest watchability win. The active speed should be visible (e.g. highlighted button or shown in the status bar), pause must still halt stepping at any speed, and the existing spiral-of-death guard (max steps per frame) must still bound the work an 8x frame can do.

## Acceptance criteria

- [ ] Controls bar offers 1x/2x/4x/8x; the active speed is visually indicated
- [ ] At Nx the sim advances N times as many ticks per wall-clock second, with identical simulation states to a 1x run of the same seed (determinism preserved)
- [ ] Pause and Reset behave correctly at every speed; speed selection survives a reset
- [ ] Slow hardware degrades gracefully via the existing max-steps-per-frame guard (no frozen tab)

## Blocked by

None - can start immediately

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
