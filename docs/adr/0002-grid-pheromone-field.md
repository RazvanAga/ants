# Grid-based pheromone field, not per-ant trail objects

The pheromone field is a fixed 2-D grid (two channels — home and food — as normalized
float arrays), coarser than the display resolution. Ants deposit by adding to the cell
they occupy and sense by sampling cells ahead; evaporation is one cheap multiply-pass over
the grid and diffusion is a double-buffered blur pass. This is stigmergy on a lattice — the
standard model for ant simulations.

## Considered Options

- **Grid field** — chosen. Evaporation, diffusion, deposit, and sensing are all O(cells) or
  O(1)-per-ant array operations; trails merge and fade naturally; rendering is one bitmap blit.
- **Discrete trail-segment objects** (each deposit a positioned, aging object) — rejected.
  Intuitive, but grows to thousands of live objects, turns "sense nearby pheromone" into a
  spatial-index problem we'd have to build, and makes evaporation a per-object sweep.

Consequence: the two full grid passes per tick (deposit-aware evaporate + diffuse) are the
dominant cost of the whole simulation — far more than the 200–800 ants — so grid resolution,
not ant count, is the number to watch for performance.
