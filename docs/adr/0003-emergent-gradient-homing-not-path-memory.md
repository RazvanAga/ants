# Emergent gradient-homing, not stored path retracing

The original spec says an ant "returns to the nest following the path it took to get there,"
which reads as storing and reversing a breadcrumb list. We deliberately do **not** do this.
Ants store no path. A carrying ant navigates home by following the home-pheromone gradient
(with a weak homing-vector fallback so it can't get permanently lost); a searching ant finds
food by following the food-pheromone gradient. Each ant deposits the pheromone leading back
to where it came from, and follows the pheromone leading where it wants to go.

## Considered Options

- **Gradient-homing via pheromones** — chosen. This is what produces the entire payoff of an
  ant simulator: wandering ants collectively discover and then *sharpen* an efficient trail,
  because shorter paths get refreshed more often and win. Fully emergent, no per-ant memory.
- **Literal path memory** (save every visited position, walk it backwards) — rejected. It
  matches the spec's wording but retraces all the random search wiggles (inefficient), makes
  every ant carry a growing array, and — critically — the emergent shortest-path behaviour
  that makes the sim worth building never appears.

This is a deliberate deviation from the literal spec. Do not "fix" ants to store their path.
