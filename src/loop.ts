/**
 * Fixed-timestep accumulator loop, decoupled from rendering (PRD-01 → Loop).
 *
 * Simulation advances in fixed `stepMs` increments regardless of the display
 * framerate, so behaviour is hardware-independent. Rendering runs once per
 * animation frame against whatever the current state is. Pausing stops stepping
 * while rendering continues.
 */
export interface LoopCallbacks {
  step: () => void;
  render: () => void;
}

export class Loop {
  private readonly stepMs: number;
  private readonly callbacks: LoopCallbacks;
  private accumulator = 0;
  private lastTime = 0;
  private rafId = 0;
  private running = false;
  paused = false;

  /** Guard against spiral-of-death after a long stall (e.g. background tab). */
  private readonly maxStepsPerFrame = 240;

  constructor(stepsPerSecond: number, callbacks: LoopCallbacks) {
    this.stepMs = 1000 / stepsPerSecond;
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private readonly frame = (now: number): void => {
    if (!this.running) return;

    const elapsed = now - this.lastTime;
    this.lastTime = now;

    if (!this.paused) {
      this.accumulator += elapsed;
      let steps = 0;
      while (this.accumulator >= this.stepMs && steps < this.maxStepsPerFrame) {
        this.callbacks.step();
        this.accumulator -= this.stepMs;
        steps++;
      }
      // Drop any backlog we couldn't catch up on, rather than spiralling.
      if (steps >= this.maxStepsPerFrame) this.accumulator = 0;
    }

    // Render every frame, even while paused, so the view stays live.
    this.callbacks.render();
    this.rafId = requestAnimationFrame(this.frame);
  };
}
