Issue: https://github.com/RazvanAga/ants/issues/9

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
The control panel around the canvas. Speed control (sim steps per frame); Reset (clear both pheromone fields and ants, respawn at the nest, zero Food collected, KEEP the nest/food layout); Clear-all (also remove nest and food sources); a Food collected display; overlay toggles to show/hide the home field, food field, and ants; and a seed field. Play/pause already exists from the skeleton.

## Acceptance criteria
- [ ] Speed control changes sim steps per frame; fast-forward and slow-mo work
- [ ] Reset clears pheromone + ants and keeps the nest/food layout; Clear-all also removes nest + food
- [ ] Food collected shown and updates live
- [ ] Overlay toggles independently show/hide home field, food field, and ants
- [ ] Seed field sets the PRNG seed
- [ ] Test: Reset keeps layout while clearing pheromone/ants; Clear-all removes nest + food
- [ ] Test: setting the seed then running is deterministic
- [ ] Finish with a commit describing the achievement

## Blocked by
- Forage loop via direct detection and homing vector: https://github.com/RazvanAga/ants/issues/5
