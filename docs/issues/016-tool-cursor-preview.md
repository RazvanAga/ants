Issue: https://github.com/RazvanAga/ants/issues/16

## What to build

A ghost preview under the cursor showing what the active tool will affect before you commit: the Erase tool shows its wipe radius as an outlined circle, the Food tool shows the footprint of the source it would drop (sized to the current next-food-size), and the Nest tool shows the nest ring outline. The preview follows the mouse while it is over the canvas, disappears when the pointer leaves, and never alters simulation state — it is drawn by the renderer on top of the frame, after ants and nest.

The preview should read clearly against the grey field without shouting (thin outline, slight transparency — matching the sim's muted aesthetic).

## Acceptance criteria

- [ ] Each tool shows an accurate ghost of its effect area/footprint at the cursor position
- [ ] Preview tracks the mouse over the canvas and vanishes when the pointer leaves
- [ ] Purely visual: no effect on world state, determinism, or the snapshot
- [ ] Erase preview radius matches the actual erase reach; food preview scales with the next-food-size slider

## Blocked by

None - can start immediately

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
