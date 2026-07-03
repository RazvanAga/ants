Issue: https://github.com/RazvanAga/ants/issues/15

## What to build

Holding the mouse button and dragging across the field should paint with the active tool instead of requiring a click per action: **Erase** wipes continuously along the drag path, and **Food** drops sources along it with a minimum-distance throttle (so a drag lays a trail of distinct sources rather than stacking hundreds per frame). The **Nest** tool stays click-only — there is exactly one nest and dragging it around mid-run is a different feature.

Placement must keep using the existing public world operations and the same canvas-coordinate mapping the click handler uses (correct under CSS scaling). Dragging out of the canvas and back, and releasing outside it, must end/resume the stroke cleanly.

## Acceptance criteria

- [ ] With Erase active, press-and-drag wipes food sources and pheromone continuously along the path
- [ ] With Food active, press-and-drag places sources spaced by a sensible minimum distance (single click still places exactly one)
- [ ] Nest remains click-only
- [ ] Stroke ends cleanly when the pointer leaves the canvas or the button is released outside it

## Blocked by

None - can start immediately

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
