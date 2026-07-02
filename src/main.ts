import { World, type WorldConfig } from "./sim/world.ts";
import { Renderer } from "./render/render.ts";
import { Loop } from "./loop.ts";

// Structural params (hardcoded for v1) and default seed.
const CONFIG: WorldConfig = { width: 640, height: 480, cellSize: 4 };
const SEED = 1;
const STEPS_PER_SECOND = 60;
/** Crumb count the next placed food source gets; driven by its slider (#10). */
const placement = { foodSize: 300 };

const canvas = document.querySelector<HTMLCanvasElement>("#field")!;
const playPause = document.querySelector<HTMLButtonElement>("#play-pause")!;
const reset = document.querySelector<HTMLButtonElement>("#reset")!;
const status = document.querySelector<HTMLSpanElement>("#status")!;

// `let`, not `const`: reset swaps in a fresh World/Renderer pair, and every
// closure below (loop callbacks, tools, sliders) reads these bindings live.
let world = new World(CONFIG, SEED);
let renderer = new Renderer(canvas, world);

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

// Reset: rebuild the world with a fresh random seed — all ants back at the
// nest, the pheromone field cleared, tick 0, and the default food source
// respawned in a new random direction (its bearing is drawn from the seed).
// The run is still reproducible: the status bar shows the new seed. The current
// slider params carry over (World copies them), so a tuned colony restarts
// with its tuning intact. Renders next frame even while paused.
reset.addEventListener("click", () => {
  world = new World(CONFIG, (Math.random() * 0x100000000) >>> 0, world.params);
  renderer = new Renderer(canvas, world);
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
  else if (tool === "food") world.addFoodSource(x, y, placement.foodSize);
  else world.eraseAt(x, y);
});

// Parameter sliders (#10): behavioural params affect the running sim the instant
// they change, because World reads world.params live every step and sliders write
// straight into it. Ant count and next-food-size need dedicated setters instead.
interface SliderSpec {
  label: string;
  min: number;
  max: number;
  step: number;
  /** Current value at load. */
  value: number;
  /** Apply a new value to the sim; called on every input event. */
  apply: (value: number) => void;
}

const sliders: SliderSpec[] = [
  { label: "Ant count", min: 0, max: 1000, step: 10, value: world.params.antCount,
    apply: (v) => world.setAntCount(v) },
  { label: "Evaporation", min: 0, max: 0.1, step: 0.005, value: world.params.evaporation,
    apply: (v) => { world.params.evaporation = v; } },
  { label: "Diffusion", min: 0, max: 0.5, step: 0.01, value: world.params.diffusion,
    apply: (v) => { world.params.diffusion = v; } },
  { label: "Sensor distance", min: 2, max: 30, step: 1, value: world.params.sensorDistance,
    apply: (v) => { world.params.sensorDistance = v; } },
  { label: "Sensor angle", min: 0.1, max: 1.5, step: 0.05, value: world.params.sensorAngle,
    apply: (v) => { world.params.sensorAngle = v; } },
  { label: "Wander", min: 0, max: 1, step: 0.05, value: world.params.wander,
    apply: (v) => { world.params.wander = v; } },
  { label: "Deposit strength", min: 0, max: 1, step: 0.05, value: world.params.depositStrength,
    apply: (v) => { world.params.depositStrength = v; } },
  { label: "Trail reach", min: 20, max: 300, step: 10, value: world.params.trailReach,
    apply: (v) => { world.params.trailReach = v; } },
  { label: "Next food size", min: 50, max: 1000, step: 50, value: placement.foodSize,
    apply: (v) => { placement.foodSize = v; } },
];

const sliderPanel = document.querySelector<HTMLDivElement>("#sliders")!;
for (const spec of sliders) {
  const label = document.createElement("label");
  const name = document.createElement("span");
  name.textContent = spec.label;
  const value = document.createElement("output");
  value.textContent = String(spec.value);
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(spec.min);
  input.max = String(spec.max);
  input.step = String(spec.step);
  input.value = String(spec.value);
  input.addEventListener("input", () => {
    const v = Number(input.value);
    value.textContent = input.value;
    spec.apply(v);
  });
  label.append(name, value, input);
  sliderPanel.append(label);
}

loop.start();
