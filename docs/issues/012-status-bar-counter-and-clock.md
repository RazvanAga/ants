Issue: https://github.com/RazvanAga/ants/issues/12

## What to build

The status bar currently shows only the seed and raw tick number. Add the colony's yield and a human-readable clock: **food collected** (the crumbs-delivered tally the sim already tracks) and **elapsed sim time** formatted as minutes:seconds (derived from the tick at 60 steps/s), alongside the seed. Raw tick can stay or go — the clock replaces its job of conveying progress.

The counter is the payoff of the whole foraging loop and is already tracked, snapshotted, and tested in the sim core; it is just never displayed. Both values must update live as the sim runs and reset visibly when the Reset button rebuilds the world.

## Acceptance criteria

- [ ] Status bar shows food collected, updating live as carriers deliver crumbs
- [ ] Status bar shows elapsed sim time as m:ss, derived from sim ticks (not wall clock), so it pauses when the sim pauses
- [ ] Reset returns both to zero
- [ ] Seed remains visible (it is what makes a run reproducible)

## Blocked by

None - can start immediately

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
