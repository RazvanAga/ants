Issue: https://github.com/RazvanAga/ants/issues/7

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
A give-up timer: if an ant goes too long since its last goal, it enters an escape-wander (ignores pheromone, applies a stronger random turn) for a short window to break loops, then resumes normal behaviour. This also realizes the spec requirement to keep searching forever when there is no food - an ant that never finds food simply keeps wandering.

## Acceptance criteria
- [ ] Ants track time since last goal; exceeding a threshold triggers escape-wander
- [ ] Escape-wander ignores pheromone and applies a stronger random turn for a bounded window, then resumes
- [ ] With all food gone, the colony keeps searching indefinitely (no permanently orbiting clumps)
- [ ] Test: an ant that exceeds the give-up threshold enters escape-wander
- [ ] Test: no ant remains stuck in a fixed orbit indefinitely
- [ ] Finish with a commit describing the achievement

## Blocked by
- Emergent pheromone-driven foraging: https://github.com/RazvanAga/ants/issues/6
