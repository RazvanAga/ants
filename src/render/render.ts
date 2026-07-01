import type { World } from "../sim/world.ts";

/**
 * Canvas renderer (PRD-01 → Rendering). Reads World state, never mutates it.
 * v1 palette is muted and naturalistic on a mid-grey field. For the skeleton it
 * draws the field and the nest; pheromone bitmap, ants and food arrive in later
 * slices.
 */
const FIELD_GREY = "#7f7f7f";
const NEST_INK = "#141414";
const NEST_RADIUS = 9;
const NEST_RING_WIDTH = 3;
const SEARCHER_INK = "#111111";
const ANT_SIZE = 3;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly world: World,
  ) {
    canvas.width = world.config.width;
    canvas.height = world.config.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    this.ctx = ctx;
  }

  render(): void {
    const { ctx, world } = this;

    // Mid-grey field.
    ctx.fillStyle = FIELD_GREY;
    ctx.fillRect(0, 0, world.config.width, world.config.height);

    // Ants — 3px dots, batched by state. Searchers are black.
    // (Carriers get their own colour once the forage loop lands.)
    const off = ANT_SIZE / 2;
    ctx.fillStyle = SEARCHER_INK;
    for (const ant of world.ants) {
      if (ant.state === "searching") {
        ctx.fillRect(ant.x - off, ant.y - off, ANT_SIZE, ANT_SIZE);
      }
    }

    // Nest — a black ring, drawn on top so the home is always visible.
    ctx.strokeStyle = NEST_INK;
    ctx.lineWidth = NEST_RING_WIDTH;
    ctx.beginPath();
    ctx.arc(world.nest.x, world.nest.y, NEST_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }
}
