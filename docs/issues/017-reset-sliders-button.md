Issue: https://github.com/RazvanAga/ants/issues/17

## What to build

A button in the slider panel that restores every slider — and the live simulation parameters they drive — to the tuned defaults in one click. After five slider experiments there is currently no way back short of reloading the page (and the world Reset button deliberately preserves slider tuning, so it does not help).

Restoring must go through each slider's existing apply path so special cases keep working (ant count respawns/culls through its setter; next-food-size updates placement state), and every slider's position and value readout must visibly snap back. It must not reset the world itself — pheromones, ants, and food stay as they are; only parameters revert.

## Acceptance criteria

- [ ] One click restores all slider-driven params to the defaults; slider positions and value readouts update to match
- [ ] Ant count respawns/culls to the default via its setter; next-food-size reverts
- [ ] World state (tick, ants' positions, field, food, collected tally) is untouched
- [ ] Works mid-run and while paused

## Blocked by

None - can start immediately

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
