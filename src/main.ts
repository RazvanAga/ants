import { World, type WorldConfig } from "./sim/world.ts";
import { Renderer } from "./render/render.ts";
import { Loop } from "./loop.ts";

// Structural params (hardcoded for v1) and default seed.
const CONFIG: WorldConfig = { width: 640, height: 480, cellSize: 4 };
const SEED = 1;
const STEPS_PER_SECOND = 60;
/** Crumb count the add-food tool places; becomes slider-driven in #10. */
const NEXT_FOOD_SIZE = 300;

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

// Placement tools (#8): pick a mode, then click the field. The World public ops
// do the work; this only maps clicks and reflects the active tool.
type Tool = "nest" | "food" | "erase";
const toolButtons: Record<Tool, HTMLButtonElement> = {
  nest: document.querySelector<HTMLButtonElement>("#tool-nest")!,
  food: document.querySelector<HTMLButtonElement>("#tool-food")!,
  erase: document.querySelector<HTMLButtonElement>("#tool-erase")!,
};
let tool: Tool = "food";

function selectTool(next: Tool): void {
  tool = next;
  for (const name of Object.keys(toolButtons) as Tool[]) {
    toolButtons[name].classList.toggle("active", name === next);
  }
}
for (const name of Object.keys(toolButtons) as Tool[]) {
  toolButtons[name].addEventListener("click", () => selectTool(name));
}
selectTool(tool);

// Map a click to field coordinates, correcting for any CSS scaling of the canvas.
canvas.addEventListener("click", (event) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  if (tool === "nest") world.moveNest(x, y);
  else if (tool === "food") world.addFoodSource(x, y, NEXT_FOOD_SIZE);
  else world.eraseAt(x, y);
});

loop.start();
