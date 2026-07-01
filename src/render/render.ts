import type { World } from "../sim/world.ts";

/**
 * Canvas renderer (PRD-01 → Rendering). Reads World state, never mutates it.
 * v1 palette is muted and naturalistic on a mid-grey field. The pheromone field
 * is drawn as a single ImageData bitmap sized to the grid and scaled up (one
 * draw call), with searching ants on top and the nest ring above them.
 */
const FIELD_GREY = { r: 0x7f, g: 0x7f, b: 0x7f };
/** Home pheromone reads white; food pheromone reads pale tan. */
const HOME_TINT = { r: 255, g: 255, b: 255 };
const FOOD_TINT = { r: 214, g: 194, b: 158 };
const NEST_INK = "#141414";
const NEST_RADIUS = 9;
const NEST_RING_WIDTH = 3;
const SEARCHER_INK = "#111111";
const CARRIER_INK = "#c8641e";
const FOOD_FILL = "#b8571c";
const ANT_SIZE = 3;
const FOOD_BLOB_POINTS = 11;

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

    // Food sources — rich brown-orange asymmetric blobs that shrink as they deplete.
    ctx.fillStyle = FOOD_FILL;
    for (const source of world.foodSources) {
      this.renderFoodBlob(source.x, source.y, source.crumbs, source.initialCrumbs);
    }

    // Ants — 3px dots, batched by state: black searchers, brown-orange carriers.
    const off = ANT_SIZE / 2;
    ctx.fillStyle = SEARCHER_INK;
    for (const ant of world.ants) {
      if (ant.state === "searching") ctx.fillRect(ant.x - off, ant.y - off, ANT_SIZE, ANT_SIZE);
    }
    ctx.fillStyle = CARRIER_INK;
    for (const ant of world.ants) {
      if (ant.state === "carrying") ctx.fillRect(ant.x - off, ant.y - off, ANT_SIZE, ANT_SIZE);
    }

    // Nest — a black ring, drawn on top so the home is always visible.
    ctx.strokeStyle = NEST_INK;
    ctx.lineWidth = NEST_RING_WIDTH;
    ctx.beginPath();
    ctx.arc(world.nest.x, world.nest.y, NEST_RADIUS, 0, Math.PI * 2);
    ctx.stroke();
  }

  /**
   * Paint the grid buffer: mid-grey base with home pheromone lifting toward
   * white and food pheromone toward pale tan, blended additively and clamped.
   */
  private renderField(): void {
    const { home, food } = this.world.field;
    const data = this.image.data;
    for (let i = 0; i < home.length; i++) {
      const h = home[i];
      const f = food[i];
      const p = i * 4;
      data[p] = tint(FIELD_GREY.r, h, HOME_TINT.r, f, FOOD_TINT.r);
      data[p + 1] = tint(FIELD_GREY.g, h, HOME_TINT.g, f, FOOD_TINT.g);
      data[p + 2] = tint(FIELD_GREY.b, h, HOME_TINT.b, f, FOOD_TINT.b);
      data[p + 3] = 255;
    }
    this.gridCtx.putImageData(this.image, 0, 0);
  }

  /**
   * A stable, asymmetric blob whose radius scales with remaining crumbs. Point
   * radii are jittered by a deterministic hash of the source position, so the
   * shape stays fixed as it shrinks rather than shimmering frame to frame.
   */
  private renderFoodBlob(x: number, y: number, crumbs: number, initialCrumbs: number): void {
    const { ctx } = this;
    const fullness = Math.sqrt(Math.max(crumbs, 0) / initialCrumbs);
    const base = 4 + 16 * fullness;
    ctx.beginPath();
    for (let i = 0; i < FOOD_BLOB_POINTS; i++) {
      const angle = (i / FOOD_BLOB_POINTS) * Math.PI * 2;
      const r = base * (0.72 + 0.5 * hashNoise(i, x));
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/** Blend a grey base toward two tints by their channel values, clamped to 255. */
function tint(base: number, h: number, homeTint: number, f: number, foodTint: number): number {
  const v = base + h * (homeTint - base) + f * (foodTint - base);
  return v > 255 ? 255 : v;
}

/** Deterministic value noise in [0, 1) from an index and a seed. */
function hashNoise(i: number, seed: number): number {
  const s = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453;
  return s - Math.floor(s);
}
