Issue: https://github.com/RazvanAga/ants/issues/5

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Close the forage loop minimally, before pheromone-following exists. Seed a default Food source (a depletable object with a position and remaining crumbs). A searching ant that comes within the small sniff radius of a Food source takes one crumb, switches to carrying, and navigates home by the weak homing vector; on reaching a goal it reorients toward its return direction (bounded by turn rate). Delivering a crumb at the Nest switches the ant back to searching, increments Food collected, and refills its deposit budget. Carrying ants deposit food pheromone (pale tan) as they travel. A Food source shrinks (rendered as a rich brown-orange asymmetric blob) and disappears when its last crumb is taken; carriers render as brown-orange dots.

## Acceptance criteria
- [ ] Default Food source present; drawn as a shrinking brown-orange asymmetric blob
- [ ] Searching ant within the sniff radius takes one crumb and becomes carrying
- [ ] Carrying ants navigate home by homing vector, reorient at goals, and deposit food pheromone (tan)
- [ ] Delivering at the Nest produces: back to searching, Food collected increments, budget refills
- [ ] Food source loses one crumb per delivery and is removed at zero
- [ ] Carriers rendered as brown-orange dots
- [ ] Test (primary seam): with a nest and nearby food source, after K steps Food collected > 0
- [ ] Test: Food source depletes to zero and is removed; ants revert to searching
- [ ] Test: state transitions searching/carrying occur as specified; run is deterministic
- [ ] Finish with a commit describing the achievement

## Blocked by
- Pheromone field: deposit, evaporate, diffuse, render: https://github.com/RazvanAga/ants/issues/4
