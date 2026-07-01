# PRD-01: Ant Colony Simulation

## Problem Statement

I want to watch a colony of ants exhibit emergent foraging behaviour that I never
explicitly programmed. I can describe how a *single* ant behaves, but I can't easily
predict — or enjoy — what hundreds of them do together: how trails form, sharpen, and
fade; how the colony discovers food and swarms it; how it disperses and re-explores once
that food runs out. I want an interactive, top-down sandbox where I place a nest and food,
press play, and study the collective result in real time, tuning the rules as I watch.

## Solution

A self-contained, browser-based, top-down simulation. A single nest sits on a grey field.
Hundreds of ants run identical simple rules — wander, follow pheromone, carry crumbs home —
and coordinate only through two pheromones deposited on a shared field (stigmergy). I place
food sources by clicking, and the colony discovers them, forms trails, and drains them,
visibly. Every behavioural parameter is a live slider I can drag while it runs, so the app
is as much an instrument for experimentation as a toy. The run is deterministic given a seed,
so I can reproduce and compare runs while tuning.

See `docs/CONTEXT.md` for the domain glossary (Ant, Searching/Carrying, Colony, Nest, Food
source, Crumb, Trail, Home/Food pheromone, Food collected) and `docs/adr/` for the three
architecture decisions this PRD assumes (no framework; grid pheromone field; emergent
gradient-homing rather than stored path memory).

## User Stories

1. As a user, I want a top-down view of a grey field, so that I have a clear canvas to watch the colony on.
2. As a user, I want a nest pre-placed dead-centre on load with a default colony already spawned, so that the simulation does something interesting the instant it opens.
3. As a user, I want to press play and pause, so that I can start and freeze the simulation at will.
4. As a user, I want a speed control, so that I can fast-forward to watch trails form or slow down to inspect behaviour.
5. As a user, I want to reset the simulation while keeping my nest and food layout, so that I can re-run the same scenario after changing a parameter.
6. As a user, I want a "clear all" that also removes the nest and food sources, so that I can start a scenario from scratch.
7. As a user, I want to place the nest by clicking, so that I can position the colony's home where I want.
8. As a user, I want to move the nest by clicking again, so that I can reposition it without resetting.
9. As a user, I want to add a food source by clicking, so that I can give the colony something to forage.
10. As a user, I want a slider that sets the size of the next food source I place, so that I can drop anything from a tiny crumb-pile to a large sustained source.
11. As a user, I want an erase tool, so that I can remove food sources or clear pheromone under the cursor.
12. As a user, I want a food source drawn as an asymmetric brown-orange blob that shrinks as it depletes, so that I can see at a glance how much is left.
13. As a user, I want a food source to disappear when its last crumb is taken, so that depletion is visually final.
14. As a user, I want ants to spawn from the nest in the searching state, so that the colony starts by exploring.
15. As a user, I want searching ants to wander with a bit of randomness, so that the colony explores rather than marching in straight lines.
16. As a user, I want a searching ant to directly detect a food source within a small sniff radius, so that a pioneering ant can discover fresh food that has no trail yet.
17. As a user, I want an ant that reaches food to pick up one crumb and switch to carrying, so that foraging is one-crumb-per-trip.
18. As a user, I want searching ants to follow the food pheromone, so that ants exploit trails others have laid to reach known food.
19. As a user, I want searching ants to deposit home pheromone as they go, so that they lay a trail leading back to the nest.
20. As a user, I want carrying ants to follow the home pheromone back toward the nest, so that they navigate home by trail rather than by stored path.
21. As a user, I want a weak homing-vector fallback for carrying ants, so that an ant never gets permanently lost when the home trail has evaporated.
22. As a user, I want carrying ants to deposit food pheromone as they go, so that they lay a trail leading to the food they found.
23. As a user, I want deposited pheromone to be strongest near its goal and fade with distance travelled, so that trails form a usable gradient that points somewhere.
24. As a user, I want an ant that reaches the nest to deliver its crumb, refill its deposit strength, and switch back to searching, so that the forage loop closes and repeats.
25. As a user, I want the nest to tally food collected, so that I can see the colony's cumulative yield.
26. As a user, I want an ant that reorients toward its return direction when it reaches a goal, so that it turns around believably rather than wandering off confused.
27. As a user, I want ants that get stuck in loops to give up and wander for a while, so that the colony doesn't accumulate uselessly orbiting ants.
28. As a user, I want ants to keep searching forever when there is no food, so that the colony stays active until I stop it.
29. As a user, I want pheromones to evaporate over time, so that stale trails fade and only refreshed paths persist.
30. As a user, I want pheromones to diffuse mildly, so that trails are soft and wide enough for ants to sense and follow smoothly.
31. As a user, I want ants to steer away from the walls at the edges of the field, so that the whole colony stays on screen.
32. As a user, I want the two pheromones colour-coded (white home trail, pale-tan food trail), so that I can read outbound and inbound flows.
33. As a user, I want ants colour-coded by state (black searchers, brown-orange carriers), so that I can see the two-way traffic between nest and food.
34. As a user, I want overlay toggles to show or hide each pheromone layer and the ants, so that I can inspect one layer at a time.
35. As a user, I want live sliders for the colony's behavioural parameters (ant count, evaporation, diffusion, sensor distance/angle, wander, deposit strength, trail reach), so that I can experiment and immediately see the effect.
36. As a user, I want changing the ant-count slider to spawn or remove ants at the nest, so that I can grow or shrink the colony live.
37. As a user, I want a seed field, so that I can reproduce a run exactly or deliberately vary it.
38. As a user, I want the same seed, layout, and parameters to always produce the same run, so that I can compare the effect of a single changed parameter fairly.
39. As a user, I want the simulation to stay behaviourally consistent regardless of my machine's framerate, so that results don't depend on hardware speed.

## Implementation Decisions

**Stack & structure.** Client-side TypeScript bundled by Vite (vanilla-ts), rendering to
an HTML Canvas. No UI framework (see ADR-0001). Modules split by responsibility: a
simulation core (world state + stepping), a pheromone-field module, an ant module, a
render module (canvas), and a UI module (DOM controls). Ants are stored as plain objects
(array-of-structs) — ample for 200–800 ants; the bottleneck is the grid, not the ants.

**Simulation core (the primary test seam).** A world holds the nest, the food sources, the
ant collection, and the two pheromone fields. A single `step()` advances the world by one
fixed timestep as a deterministic function of `(state, params, seed)`, fully decoupled from
rendering. The core exposes public operations (place/move nest, add food source with a
given size, erase, set parameters, set seed, reset, clear-all, set ant count) and public
queries (food collected, ant states and positions, food-source remaining crumbs, pheromone
field values). Rendering reads world state but never mutates it.

**Loop.** Fixed-timestep accumulator drives `step()`; rendering is decoupled and draws the
current state each animation frame. Speed control runs more or fewer sim steps per frame;
pause stops stepping while rendering continues.

**Determinism.** A seeded PRNG (e.g. mulberry32) supplies all randomness; combined with the
fixed timestep and a consistent per-tick update order, the same seed + layout + params
reproduce a run exactly. Seed is exposed in the UI.

**Pheromone field (grid, see ADR-0002).** Two channels — home and food — as normalized
(0–1) float grids at a fixed cell resolution coarser than the display (hardcoded for v1,
e.g. ~4px cells). Per tick, in order: (1) all ants sense a start-of-tick snapshot of the
field and move; (2) ants deposit into their current cell, additively, clamped to a maximum;
(3) the field diffuses (double-buffered A→B blur, swap) and evaporates (decay), combined in
one grid pass; (4) render. Because ants deposit after sensing, an ant never senses its own
just-laid deposit in the same tick. Grid clamps at the walls (no diffusion off-field).

**Ant behaviour (emergent gradient-homing, see ADR-0003).** Each ant has a position,
heading, state (searching/carrying), and a deposit budget. Steering uses three forward
sensors (front-left, -centre, -right), each sampling a 3×3 averaged patch of the relevant
pheromone channel; the ant steers toward the strongest reading plus a random wander,
bounded by a maximum turn rate. Searching ants follow food pheromone and deposit home
pheromone; carrying ants follow home pheromone (with a weak homing-vector fallback) and
deposit food pheromone — an ant deposits the pheromone for where it came from and follows
the one for where it's going. The deposit budget starts full at a goal and decays linearly
to zero over a tunable "trail reach" distance, producing the gradient; reaching a goal
(nest or food source) refills it. On reaching a goal the ant switches state and reorients
toward its return direction, bounded by the turn rate. A give-up timer: if too long since
the last goal, the ant enters an escape-wander (ignores pheromone, stronger random turn)
to break loops; this also realizes "search forever when there's no food". Pioneers discover
fresh food by a small direct-detection sniff radius; followers arrive via the food trail —
both are the same code path, not distinct ant types.

**World.** A single closed field with solid walls; ants steer away from edges. Exactly one
nest, pre-placed centre on load, acting as both spawn origin and delivery point. Food
sources are depletable objects (position + remaining crumbs); one crumb taken per ant visit;
removed at zero. No obstacles in v1.

**Rendering.** Muted naturalistic palette on a mid-grey field. The pheromone field is drawn
as a single ImageData bitmap blit (one draw call) sized to the grid and scaled up: home
pheromone → white, food pheromone → pale tan (same warm hue family as food, separated by
saturation/brightness). Ants are 3px dots drawn on top, batched by state: black searchers,
deep brown-orange carriers. Nest is a black ring; food source is a rich brown-orange
asymmetric blob that shrinks as it depletes. Food collected shown as a counter.

**UI.** Canvas plus a control panel. Tools: place nest / add food source (size slider) /
erase. Sim controls: play-pause, reset (keep layout), clear-all, speed. Live-tunable
parameters: ant count, food size, evaporation, diffusion, sensor distance/angle, wander,
deposit strength, trail reach, plus overlay toggles and the seed field. Structural
parameters (grid resolution, world size) are hardcoded for v1; changing them would require
a reset.

## Testing Decisions

**What makes a good test here.** Tests assert on *external, observable behaviour* of the
simulation core — colony-level outcomes and public queries — never on internal
implementation details (no asserting on private steering intermediates or exact float
noise). Determinism is what makes behavioural assertions stable: a fixed seed + fixed
timestep + fixed layout replays identically, so a test can step the world a known number of
times and assert on the result.

**Primary seam — the headless simulation core.** Construct a world via its public
operations, `step()` it N times, and assert on public queries. Representative tests:
- Forage loop closes: with a nest and a nearby food source, after K steps **food collected**
  is greater than zero.
- Trail formation: after sustained foraging, food-pheromone values along the nest↔food
  corridor are raised relative to off-corridor cells.
- Depletion: a food source's remaining crumbs decrease by one per delivering visit and the
  source is removed at zero; ants that arrive at an emptied location revert to **searching**.
- Evaporation: with deposits stopped, pheromone field values decay toward zero over time.
- State transitions: an ant that reaches food becomes **carrying**; an ant that reaches the
  nest becomes **searching** and increments **food collected**.
- Determinism: identical seed + layout + params yield identical world state after N steps;
  a changed seed yields a different one.

**Lower seams — the error-prone math, tested directly as pure functions.**
- Pheromone field: a deposit raises a cell and is clamped at the maximum; a diffusion pass
  is symmetric (double-buffered, no directional smear); unrefreshed cells decay.
- Ant steering: given a constructed field snapshot and ant state, the three-sensor rule
  selects the expected turn direction.

**Above the seam, not unit-tested.** The render module (canvas bitmap blit) and the UI
module (DOM controls) are thin and visual; they are verified by eye during development, not
with brittle DOM/canvas tests.

**Prior art.** None — greenfield project. These tests establish the pattern: deterministic,
headless, behaviour-level tests of the simulation core, with focused pure-function tests for
the grid and steering math.

## Out of Scope

- Obstacles or walls placed inside the field (v1 has only the boundary walls).
- Multiple nests or multiple colonies.
- Multiple food *types* or ants carrying more than one crumb per trip.
- Saving/loading scenarios, or exporting runs.
- Native desktop or mobile packaging (browser only).
- Performance work for tens of thousands of ants (design targets 200–800; grid resolution
  and world size are hardcoded for v1).
- User-configurable grid resolution / world size at runtime.
- Any server, backend, persistence, or multiplayer.
- Oriented ant sprites, animation frames, or sound.

## Further Notes

- The counterintuitive pheromone naming is the single likeliest source of bugs: the
  pheromone a *searching* ant deposits is the *home* pheromone. The governing rule — deposit
  the pheromone for where you came from, follow the one for where you're going — is recorded
  in `docs/CONTEXT.md` and must be honoured consistently in code identifiers
  (`homeField`/`foodField`) to avoid wiring a sensor to the wrong channel.
- Two full grid passes per tick (deposit-aware evaporate + diffuse) dominate the sim cost,
  far more than the ants (ADR-0002). If performance ever suffers, lower grid resolution or
  sim step rate before reaching for a faster language — the fixed timestep makes this safe.
- Build in vertical slices for fastest feedback: wandering ants + walls → pheromone field
  (deposit/evaporate/diffuse) → following behaviour → the food/nest forage loop → UI sliders.
- Sensible defaults should make the app immediately engaging on load (centred nest,
  default colony spawned, ready to drop food).
