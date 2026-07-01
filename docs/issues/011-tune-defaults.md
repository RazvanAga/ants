Issue: https://github.com/RazvanAga/ants/issues/11

## Parent
PRD-01: Ant Colony Simulation - https://github.com/RazvanAga/ants/issues/1

## What to build
With everything live-tunable, tune the default parameters (and verify the palette) so the colony exhibits satisfying emergent behaviour out of the box: trails visibly form, sharpen, and fade; food is discovered and drained; searchers and carriers read clearly; and the whole thing looks good on the mid-grey field. This is human-in-the-loop: it requires watching the running sim and exercising aesthetic/behavioural judgment, then committing the chosen defaults.

## Acceptance criteria
- [ ] Default parameters produce visible trail formation, sharpening, and fading without manual tuning
- [ ] Food is reliably discovered and drained by the default colony
- [ ] Palette reads clearly: black searchers, brown-orange carriers, white home trail, tan food trail, black nest ring, brown-orange food blob on grey
- [ ] On load the sim is immediately engaging (centred nest, default colony spawned, ready to drop food)
- [ ] Chosen defaults committed
- [ ] Finish with a commit describing the achievement

## Blocked by
- Live parameter sliders: https://github.com/RazvanAga/ants/issues/10
