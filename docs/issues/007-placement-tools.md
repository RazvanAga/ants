Issue: https://github.com/RazvanAga/ants/issues/8

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Interactive placement. A tool mode to place/move the single Nest by clicking; a tool mode to add a Food source by clicking (using the current next-food-size); and an erase tool that removes a Food source or clears pheromone under the cursor. These operate through the World public operations.

## Acceptance criteria
- [ ] Place-Nest tool sets/moves the single Nest to the clicked point
- [ ] Add-Food tool creates a Food source of the current size at the clicked point
- [ ] Erase tool removes a Food source / clears pheromone under the cursor
- [ ] Test: place-nest moves the nest; add-food adds a source of the given size; erase removes it
- [ ] Finish with a commit describing the achievement

## Blocked by
- Forage loop via direct detection and homing vector: https://github.com/RazvanAga/ants/issues/5
