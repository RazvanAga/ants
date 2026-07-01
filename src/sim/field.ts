/**
 * The pheromone field — stigmergy on a lattice (ADR-0002).
 *
 * Two normalized (0–1) channels, `home` and `food`, on a fixed grid coarser than
 * the display. Ants deposit by adding to the cell they occupy (clamped to a max)
 * and sense by sampling cells. Each tick the field decays (evaporation) and
 * blurs (diffusion) in one double-buffered pass. The two full grid passes per
 * tick are the dominant cost of the whole sim, so grid resolution — not ant
 * count — is the number to watch.
 *
 * Naming (docs/CONTEXT.md): an ant deposits the pheromone for where it came
 * *from* and follows the one for where it's *going*. Searching ants (from the
 * nest) deposit `home`; carrying ants (from food) deposit `food`.
 */
export type Channel = "home" | "food";

/** Maximum value any cell can hold; channels are normalized to [0, 1]. */
const MAX = 1;

export class PheromoneField {
  readonly cols: number;
  readonly rows: number;
  readonly cellSize: number;

  /** Front buffers — the live field, read by sensing and rendering. */
  home: Float32Array;
  food: Float32Array;

  /** Back buffers — scratch space for the double-buffered diffuse pass. */
  private homeBack: Float32Array;
  private foodBack: Float32Array;

  constructor(width: number, height: number, cellSize: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    const n = this.cols * this.rows;
    this.home = new Float32Array(n);
    this.food = new Float32Array(n);
    this.homeBack = new Float32Array(n);
    this.foodBack = new Float32Array(n);
  }

  private channel(ch: Channel): Float32Array {
    return ch === "home" ? this.home : this.food;
  }

  /** Cell column/row containing a world-space point, clamped to the grid. */
  private colOf(x: number): number {
    return clampInt(Math.floor(x / this.cellSize), this.cols);
  }
  private rowOf(y: number): number {
    return clampInt(Math.floor(y / this.cellSize), this.rows);
  }

  /** Add `amount` to the cell under a world-space point, clamped to the max. */
  deposit(ch: Channel, x: number, y: number, amount: number): void {
    const g = this.channel(ch);
    const i = this.rowOf(y) * this.cols + this.colOf(x);
    const v = g[i] + amount;
    g[i] = v > MAX ? MAX : v;
  }

  /** Read a channel's value at a world-space point. */
  valueAt(ch: Channel, x: number, y: number): number {
    return this.channel(ch)[this.rowOf(y) * this.cols + this.colOf(x)];
  }

  /** Read a channel's value at a specific cell. */
  valueAtCell(ch: Channel, col: number, row: number): number {
    return this.channel(ch)[row * this.cols + col];
  }

  /**
   * One combined evaporate + diffuse pass over both channels. Diffusion is a
   * double-buffered 4-neighbour blur with edge replication (no diffusion off the
   * field, so mass clamps at the walls) — symmetric, no directional smear.
   */
  decayAndDiffuse(evaporation: number, diffusion: number): void {
    this.pass(this.home, this.homeBack, evaporation, diffusion);
    [this.home, this.homeBack] = [this.homeBack, this.home];
    this.pass(this.food, this.foodBack, evaporation, diffusion);
    [this.food, this.foodBack] = [this.foodBack, this.food];
  }

  private pass(
    src: Float32Array,
    dst: Float32Array,
    evaporation: number,
    diffusion: number,
  ): void {
    const { cols, rows } = this;
    const retention = 1 - evaporation;
    for (let row = 0; row < rows; row++) {
      const up = row > 0 ? row - 1 : 0;
      const down = row < rows - 1 ? row + 1 : rows - 1;
      for (let col = 0; col < cols; col++) {
        const left = col > 0 ? col - 1 : 0;
        const right = col < cols - 1 ? col + 1 : cols - 1;
        const i = row * cols + col;
        const self = src[i];
        const avg =
          (src[row * cols + left] +
            src[row * cols + right] +
            src[up * cols + col] +
            src[down * cols + col]) /
          4;
        dst[i] = retention * (self + diffusion * (avg - self));
      }
    }
  }
}

function clampInt(v: number, size: number): number {
  return v < 0 ? 0 : v >= size ? size - 1 : v;
}
