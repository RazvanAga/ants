Issue: https://github.com/RazvanAga/ants/issues/14

## What to build

Keyboard shortcuts for the controls you reach for constantly while watching runs: **Space** toggles pause/play, **R** resets, **1/2/3** select the Nest/Food/Erase tools, and **+/−** (or =/-) step the sim speed up and down through the 1x/2x/4x/8x levels from #13.

Shortcuts must drive the same code paths as the buttons and keep the button UI in sync (pause label, active tool highlight, active speed indicator). They must not fire while a slider or other form control has focus, and Space must not double-trigger a focused button (the browser's default Space-activates-button behaviour) — clicking Pause then pressing Space should toggle once, not twice.

## Acceptance criteria

- [ ] Space toggles pause/play; R resets; 1/2/3 select tools; +/− change speed
- [ ] Each shortcut updates the corresponding button/indicator state exactly as a click would
- [ ] No double-activation when a control button has focus; no interference while sliders are focused
- [ ] Shortcuts are discoverable (e.g. title tooltips on the buttons showing the key)

## Blocked by

- #13 (speed keys bind to its speed levels)

---
Finish by creating a commit whose message describes what was achieved (the issue title is a fine default).
