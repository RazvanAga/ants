import { describe, it, expect } from "vitest";
import { World, type WorldConfig } from "./world.ts";
import { DEFAULT_PARAMS } from "./params.ts";

// The app's real field, so the post-depletion ghost dynamics match production.
const config: WorldConfig = { width: 640, height: 480, cellSize: 4 };

/** Run a world until its food sources are all gone, or `limit` ticks elapse. */
function drain(world: World, limit: number): void {
  let tick = 0;
  while (world.foodSources.length > 0 && tick < limit) {
    world.step();
    tick++;
  }
}

/**
 * Regression for the clump-after-depletion trap (see the "escape" slice #7 and
 * docs). Once a colony drains every crumb, the food channel doesn't vanish — it
 * decays toward zero but never reaches it, leaving a *ghost* trail whose sign the
 * three sensors would still follow at full strength, pinning the whole colony
 * orbiting the dead site forever. `foodSenseFloor` makes searching ants ignore
 * that sub-threshold ghost and wander instead, so a drained colony disperses and
 * re-engages food dropped somewhere new.
 */
describe("re-engagement after total depletion", () => {
  it("rediscovers and works a fresh source dropped far from a drained one", () => {
    for (const seed of [1, 2, 3]) {
      const world = new World(config, seed);

      // The out-of-the-box source is discovered and fully drained; a short tail
      // lets the last carriers deliver crumbs that were in transit at depletion.
      drain(world, 2500);
      expect(world.foodSources).toHaveLength(0);
      for (let i = 0; i < 400; i++) world.step();
      expect(world.foodCollected).toBe(300); // every crumb collected and hauled home

      // Drop a fresh source far away, on the opposite side of the nest from the
      // old one (old: right/up; new: left/down), then let the colony run.
      const collectedBefore = world.foodCollected;
      world.addFoodSource(
        world.nest.x - config.width * 0.28,
        world.nest.y + config.height * 0.28,
        300,
      );
      for (let i = 0; i < 3000; i++) world.step();

      // The colony re-engaged: it found the new source and hauled crumbs home.
      expect(world.foodCollected).toBeGreaterThan(collectedBefore + 50);
    }
  });

  it("disperses off the dead site instead of clumping on the ghost trail", () => {
    const world = new World(config, 4);
    const [food] = world.foodSources;
    const deadSite = { x: food.x, y: food.y };

    drain(world, 2500);
    expect(world.foodSources).toHaveLength(0);

    // Let the ghost trail decay below the sense floor and the colony spread.
    for (let i = 0; i < 1500; i++) world.step();

    // Ants are genuinely spread across the field, not pooled on the dead site.
    const nearDeadSite = world.ants.filter(
      (a) => Math.hypot(a.x - deadSite.x, a.y - deadSite.y) < 40,
    ).length;
    expect(nearDeadSite).toBeLessThan(world.ants.length * 0.25);

    const maxFromNest = Math.max(
      ...world.ants.map((a) => Math.hypot(a.x - world.nest.x, a.y - world.nest.y)),
    );
    expect(maxFromNest).toBeGreaterThan(150); // reaching well out into the field
  });

  it("stays deterministic across the drain → drop → rediscover arc", () => {
    const build = () => {
      const w = new World(config, 99, { ...DEFAULT_PARAMS });
      drain(w, 2500);
      w.addFoodSource(w.nest.x - 160, w.nest.y + 130, 300);
      for (let i = 0; i < 1500; i++) w.step();
      return w;
    };
    expect(build().snapshot()).toEqual(build().snapshot());
  });
});
