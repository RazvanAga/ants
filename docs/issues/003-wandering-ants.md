Issue: https://github.com/RazvanAga/ants/issues/3

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
Ants spawn at the Nest in the searching state and wander the field: each step applies a small random turn bounded by a maximum turn rate, and ants steer away from the boundary walls so the whole colony stays on screen. Ants are drawn as 3px black dots on top of the field.

## Acceptance criteria
- [ ] Ants spawn at the Nest in the searching state with randomised headings
- [ ] Wander: bounded random turn per step; motion looks antlike, not jittery
- [ ] Ants steer away from walls and remain within the field bounds
- [ ] Searching ants rendered as 3px black dots
- [ ] Test: after N steps all ants are within bounds
- [ ] Test: given a fixed seed, ant positions after N steps are deterministic
- [ ] Finish with a commit describing the achievement

## Blocked by
- Walking skeleton: https://github.com/RazvanAga/ants/issues/2
