Issue: https://github.com/RazvanAga/ants/issues/2

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
The tracer bullet through the whole stack: a Vite (vanilla-ts) app that renders a mid-grey field to an HTML Canvas, driven by a fixed-timestep accumulator loop that is decoupled from rendering, with a seeded PRNG (e.g. mulberry32) supplying all randomness. A headless World holds simulation state and exposes a deterministic step(); on load it contains a single Nest pre-placed dead-centre, drawn as a black ring. Play/pause control. Establishes the test harness and the primary seam (headless deterministic sim core) with a first determinism test.

## Acceptance criteria
- [ ] App builds and runs under Vite (vanilla-ts); canvas shows a mid-grey field
- [ ] Fixed-timestep accumulator loop advances the sim; rendering is decoupled and framerate-independent
- [ ] Seeded PRNG plumbed through the sim; seed value lives on the World
- [ ] Headless World with a centred Nest, exposing step() and public queries, usable without the DOM
- [ ] Nest rendered as a black ring
- [ ] Play/pause stops/starts stepping while rendering continues
- [ ] Test: same seed + same steps produce identical World state (determinism)
- [ ] Finish with a commit describing the achievement

## Blocked by
None - can start immediately
