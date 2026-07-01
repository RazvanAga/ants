# Ant Colony Simulation

A top-down simulation where hundreds of individually-simple ants produce emergent
colony behaviour (trail formation, foraging, depletion) through stigmergy — indirect
coordination via pheromones deposited on a shared field. This glossary defines the
domain language; it holds no implementation detail.

## Language

### Ants

**Ant**:
A single autonomous agent. Follows simple local rules; the colony's behaviour is
emergent, never directed. Always in exactly one of two states.

**Searching**:
The ant state of looking for food. A searching ant follows food pheromone and deposits
home pheromone.
_Avoid_: foraging, exploring (as the state name)

**Carrying**:
The ant state of holding a food crumb. A carrying ant follows home pheromone and deposits
food pheromone. Named for the ant's *condition* (has-food), not its motion — a carrying
ant that has given up on a trail may wander rather than head home, yet is still carrying.
_Avoid_: returning, homing (as the state name)

**Colony**:
The whole population of ants sharing one nest. The unit whose emergent behaviour is the
subject of the simulation.

**Food collected**:
The running tally of crumbs delivered to the nest — the colony's cumulative yield.
_Avoid_: score, harvest, yield

### The world

**Nest**:
The colony's single home. Ants spawn here and deliver crumbs here; it is both the
spawn origin and the destination every carrying ant aims for.

**Food source**:
A placed, depletable object with a position and a remaining quantity of crumbs. Ants take
one crumb per visit; when its quantity reaches zero it disappears.
_Avoid_: pile, blob (blob is a rendering word, not a domain word)

**Crumb**:
One unit of food — what a single ant carries in one trip. A food source holds many crumbs;
an ant takes one.
_Avoid_: food (the substance) used to mean the object

**Trail**:
An emergent path of concentrated pheromone, created and reinforced by ant traffic. Not a
stored object — a trail exists only as raised values on the pheromone field, and fades by
evaporation when no longer refreshed.

### Pheromones

The colony coordinates entirely through two pheromones on a shared field. The governing
rule that resolves their counterintuitive naming: **an ant deposits the pheromone named
for where it came *from*, and follows the pheromone named for where it wants to *go*.**

**Home pheromone**:
The trail that leads back to the nest. Deposited by searching ants (who came from the
nest); followed by carrying ants trying to get home.
_Avoid_: searching pheromone, search trail, "looking for food" pheromone

**Food pheromone**:
The trail that leads to a food source. Deposited by carrying ants (who came from food);
followed by searching ants trying to find food.
_Avoid_: returning pheromone, "found food" pheromone, return trail
