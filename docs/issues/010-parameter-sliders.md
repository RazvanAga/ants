Issue: https://github.com/RazvanAga/ants/issues/10

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Expose the behavioural parameters as live sliders that affect the running sim immediately: evaporation, diffusion, sensor distance, sensor angle, wander strength, deposit strength, trail reach, ant count (raising spawns ants at the nest in searching state; lowering removes them), and next-food-size. Structural params (grid resolution, world size) stay hardcoded.

## Acceptance criteria
- [ ] Sliders for evaporation, diffusion, sensor distance/angle, wander, deposit strength, trail reach
- [ ] All behavioural sliders take effect live on the running sim
- [ ] Ant-count slider spawns/removes ants at the nest live
- [ ] Food-size slider sets the size of the next placed Food source
- [ ] Test: changing ant count adds/removes ants; a changed parameter changes step output
- [ ] Finish with a commit describing the achievement

## Blocked by
- Emergent pheromone-driven foraging: https://github.com/RazvanAga/ants/issues/6
- Control panel: sim controls, counter, overlays, seed: https://github.com/RazvanAga/ants/issues/9
