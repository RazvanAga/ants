Issue: https://github.com/RazvanAga/ants/issues/4

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Two normalized (0-1) pheromone grid channels (home and food) at a fixed cell resolution coarser than the display (hardcoded for v1). Searching ants deposit home pheromone into their current cell, additively and clamped to a maximum, AFTER sensing/moving (so an ant never senses its own just-laid deposit that tick). Each tick the field evaporates (decay) and diffuses (double-buffered A to B blur, then swap), combined in one grid pass; the grid clamps at the walls. The field is rendered as a single ImageData bitmap blit scaled to the display, with home pheromone shown white. Ants draw on top.

## Acceptance criteria
- [ ] Two normalized float grid channels (home, food) at a hardcoded cell resolution
- [ ] Searching ants deposit home pheromone after sensing/moving; deposits clamp to a max
- [ ] Evaporation decays the field over time; diffusion is double-buffered (no directional smear)
- [ ] Field rendered via one ImageData blit; home pheromone reads as white on grey; ants on top
- [ ] Test (lower seam): a deposit raises a cell and is clamped at the max
- [ ] Test (lower seam): unrefreshed cells decay toward zero
- [ ] Test (lower seam): a diffusion pass is symmetric
- [ ] Finish with a commit describing the achievement

## Blocked by
- Wandering ants with wall avoidance: https://github.com/RazvanAga/ants/issues/3
