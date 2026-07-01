import type { World } from "../sim/world.ts";

/**
 * Canvas renderer (PRD-01 → Rendering). Reads World state, never mutates it.
 * v1 palette is muted and naturalistic on a mid-grey field. The pheromone field
 * is drawn as a single ImageData bitmap sized to the grid and scaled up (one
 * draw call), with searching ants on top and the nest ring above them.
 */
const FIELD_GREY = { r: 0x7f, g: 0x7f, b: 0x7f };
const NEST_INK = "#141414";
const NEST_RADIUS = 9;
const NEST_RING_WIDTH = 3;
const SEARCHER_INK = "#111111";
const ANT_SIZE = 3;

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;

  /** Off-screen buffer at grid resolution; blitted scaled to the display. */
  private readonly grid: HTMLCanvasElement;
  private readonly gridCtx: CanvasRenderingContext2D;
  private readonly image: ImageData;

  constructor(
    canvas: HTMLCanvasElement,
    private readonly world: World,
  ) {
    canvas.width = world.config.width;
    canvas.height = world.config.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2D canvas context unavailable");
    ctx.imageSmoothingEnabled = false; // crisp scaled blit
    this.ctx = ctx;

    const { cols, rows } = world.field;
    this.grid = document.createElement("canvas");
    this.grid.width = cols;
    this.grid.height = rows;
    const gridCtx = this.grid.getContext("2d");
    if (!gridCtx) throw new Error("2D canvas context unavailable");
    this.gridCtx = gridCtx;
    this.image = gridCtx.createImageData(cols, rows);
  }

  render(): void {
    const { ctx, world } = this;
    const { width, height } = world.config;

    this.renderField();
    ctx.drawImage(this.grid, 0, 0, world.field.cols, world.field.rows, 0, 0, width, height);

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

  /** Paint the grid buffer: mid-grey base, home pheromone lifting toward white. */
  private renderField(): void {
    const { home } = this.world.field;
    const data = this.image.data;
    for (let i = 0; i < home.length; i++) {
      // v in [0,1]: blend the grey field toward white by the home value.
      const v = home[i];
      const p = i * 4;
      data[p] = FIELD_GREY.r + v * (255 - FIELD_GREY.r);
      data[p + 1] = FIELD_GREY.g + v * (255 - FIELD_GREY.g);
      data[p + 2] = FIELD_GREY.b + v * (255 - FIELD_GREY.b);
      data[p + 3] = 255;
    }
    this.gridCtx.putImageData(this.image, 0, 0);
  }
}
