Issue: https://github.com/RazvanAga/ants/issues/6

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Make trails actually drive behaviour. Ants steer using three forward sensors (front-left/centre/right), each sampling a 3x3 averaged patch of the relevant channel: searching ants follow food pheromone toward food; carrying ants follow home pheromone toward the nest, with the homing vector demoted to a weak fallback. The deposit budget starts full at a goal and decays linearly to zero over a tunable trail-reach distance, producing a followable gradient (strongest near the goal). Result: trails form between nest and food, and followers exploit and sharpen them.

## Acceptance criteria
- [ ] Three-sensor steering with 3x3 averaged patches per sensor
- [ ] Searching ants follow food pheromone; carrying ants follow home pheromone (vector = fallback only)
- [ ] Deposit budget decays linearly over trail reach, refilled at goals, producing a usable gradient
- [ ] A visible food-pheromone trail forms along the nest-food corridor and is followed
- [ ] Test (primary seam): a trail of raised food pheromone forms along the corridor under sustained foraging
- [ ] Test (lower seam): given a field snapshot + ant state, the sensor rule picks the expected turn
- [ ] Finish with a commit describing the achievement

## Blocked by
- Forage loop via direct detection and homing vector: https://github.com/RazvanAga/ants/issues/5
