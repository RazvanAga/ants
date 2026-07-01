import { World, type WorldConfig } from "./sim/world.ts";
import { Renderer } from "./render/render.ts";
import { Loop } from "./loop.ts";

// Structural params (hardcoded for v1) and default seed.
const CONFIG: WorldConfig = { width: 640, height: 480, cellSize: 4 };
const SEED = 1;
const STEPS_PER_SECOND = 60;

const canvas = document.querySelector<HTMLCanvasElement>("#field")!;
const playPause = document.querySelector<HTMLButtonElement>("#play-pause")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;

const world = new World(CONFIG, SEED);
const renderer = new Renderer(canvas, world);

const loop = new Loop(STEPS_PER_SECOND, {
  step: () => world.step(),
  render: () => {
    renderer.render();
    status.textContent = `seed ${world.seed} · tick ${world.tick}${
      loop.paused ? " · paused" : ""
    }`;
  },
});

playPause.addEventListener("click", () => {
  loop.paused = !loop.paused;
  playPause.textContent = loop.paused ? "Play" : "Pause";
});

loop.start();
