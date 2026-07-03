# Ants

An interactive, top-down **ant colony simulation** where hundreds of individually-simple
ants produce complex, emergent foraging behaviour — trails that form, sharpen, and fade —
with no colony-level choreography. You dictate the rules for a *single* ant; the swarm does
the rest.

> **Status:** playable. The full foraging simulation is built — emergent trails, live
> tuning, placement tools, and the quality-of-life controls below all work. The design lives
> in [`docs/`](docs/); work is tracked as [issues](https://github.com/RazvanAga/ants/issues).

## The idea

Place a nest, drop food wherever you like, and watch the colony discover it, swarm it,
drain it, and disperse to explore again. Every ant runs the same tiny rulebook and the ants
coordinate only indirectly — through pheromones they deposit on a shared field
(**stigmergy**). The mesmerising trails you see are emergent, never programmed.

The colony uses **two pheromones**, governed by one rule:

> *An ant deposits the pheromone that leads back to where it came **from**, and follows the
> pheromone that leads to where it wants to **go**.*

- **Home pheromone** — laid by *searching* ants (who came from the nest), so it leads home.
  *Carrying* ants follow it to get back.
- **Food pheromone** — laid by *carrying* ants (who came from food), so it leads to food.
  *Searching* ants follow it to find their way there.

A pioneer stumbles onto fresh food by direct sight; every ant after it arrives along the
trail — and because shorter paths get refreshed more often, the trail naturally sharpens
into an efficient route. That collective optimisation is the whole point.

## How a single ant behaves

- **Searches** by wandering, following the food pheromone, and sniffing for nearby food.
- On reaching food, takes one **crumb**, switches to **carrying**, and heads home along the
  home pheromone (with a weak homing-vector fallback so it never gets truly lost).
- Delivers the crumb at the nest, adds to the **food collected** tally, and goes back to
  searching.
- Deposits fade with distance from the last goal, so trails form a usable gradient.
- If it gets stuck in a loop, it gives up and wanders to break free — and keeps searching
  forever, even when no food is left.

## Design highlights

- **Grid-based pheromone field** (stigmergy on a lattice) with evaporation + mild diffusion,
  rendered as a single bitmap blit — not per-ant trail objects.
- **Emergent gradient-homing**, deliberately *not* stored path-retracing — this is what
  produces the self-optimising trails.
- **Deterministic core:** fixed-timestep simulation + seeded RNG, decoupled from rendering,
  so a run is reproducible from its seed and framerate-independent.
- **Fully live-tunable:** evaporation, diffusion, sensor geometry, wander, deposit strength,
  trail reach, colony size — all draggable while it runs.
- Muted, top-down aesthetic on a grey field: black searchers, brown-orange carriers, white
  home trails, tan food trails.

Targets **200–800 ants** at 60 fps in the browser. See the architecture decisions for why
that makes native code unnecessary here.

## Controls

- **Play/Pause & Reset** — pause freezes stepping while the view stays live; Reset rebuilds
  the world with a fresh seed but keeps your slider tuning.
- **Placement tools** — Nest, Food, Erase. **Press-and-drag to paint**: Erase wipes along
  the path, Food lays a spaced trail of sources; Nest is click-only. A ghost cursor previews
  each tool's reach before you commit.
- **Speed** — fast-forward at 1x / 2x / 4x / 8x. Higher speeds pass through the *identical*
  deterministic states, just faster on the wall clock.
- **Status bar** — live **food collected** tally and an elapsed sim clock (`m:ss`, derived
  from ticks so it pauses with the sim), alongside the reproducible seed.
- **Sliders** — every behavioural parameter, draggable while it runs, with a one-click
  **Reset sliders to defaults** that reverts tuning without disturbing the running world.
- **Keyboard** — `Space` play/pause · `R` reset · `1`/`2`/`3` tools · `+`/`−` speed.

## Tech stack

- **TypeScript** + **Vite** (vanilla-ts) — a self-contained, client-side app.
- **HTML Canvas** for rendering. No UI framework: it is a real-time loop, not a
  server-driven page. (See [ADR-0001](docs/adr/0001-client-side-canvas-no-framework.md).)

## Documentation

| Doc | What it is |
|-----|-----------|
| [docs/README.md](docs/README.md) | Index of all project docs |
| [docs/CONTEXT.md](docs/CONTEXT.md) | Glossary / ubiquitous language (ant, nest, crumb, pheromones…) |
| [docs/PRD-01.md](docs/PRD-01.md) | Product requirements |
| [docs/adr/](docs/adr/) | Architecture decision records |
| [docs/issues/](docs/issues/) | Issue specs, mirrored from the tracker |

## Roadmap

Built in vertical slices — each demoable on its own. The core simulation is complete:

1. ✅ Walking skeleton: canvas, deterministic loop, nest
2. ✅ Wandering ants with wall avoidance
3. ✅ Pheromone field: deposit, evaporate, diffuse, render
4. ✅ Forage loop (direct detection + homing vector)
5. ✅ Emergent pheromone-driven foraging
6. ✅ Anti-stuck escape-wander & search-forever
7. ✅ Placement tools: nest, food source, erase
8. ✅ Control panel: sim controls, counter, overlays, seed
9. ✅ Live parameter sliders
10. ✅ Tune defaults for satisfying emergence

Followed by quality-of-life polish — status bar counter & clock, speed control,
keyboard shortcuts, drag-to-paint, tool cursor preview, and reset-sliders.

Track progress on the [issues board](https://github.com/RazvanAga/ants/issues).

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run the sim test suite
npm run build    # typecheck + production build
```
