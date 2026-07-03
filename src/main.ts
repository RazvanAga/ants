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
// Just the word, so flipping it leaves the button's keycap intact.
const ppLabel = document.querySelector<HTMLSpanElement>("#pp-label")!;
const reset = document.querySelector<HTMLButtonElement>("#reset")!;
// Live readouts: separate stat tiles. Run state is shown by the Pause button.
const statFood = document.querySelector<HTMLSpanElement>("#stat-food")!;
const statTime = document.querySelector<HTMLSpanElement>("#stat-time")!;
const statSeed = document.querySelector<HTMLSpanElement>("#stat-seed")!;

// `let`, not `const`: reset swaps in a fresh World/Renderer pair, and every
// closure below (loop callbacks, tools, sliders) reads these bindings live.
let world = new World(CONFIG, SEED);
let renderer = new Renderer(canvas, world);

// Sim time is derived from ticks, not the wall clock, so it pauses when the sim
// pauses and stays reproducible per seed. Format as m:ss.
function formatClock(tick: number): string {
  const totalSeconds = Math.floor(tick / STEPS_PER_SECOND);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const loop = new Loop(STEPS_PER_SECOND, {
  step: () => world.step(),
  render: () => {
    renderer.render();
    statFood.textContent = String(world.foodCollected);
    statTime.textContent = formatClock(world.tick);
    statSeed.textContent = String(world.seed);
  },
});

function togglePause(): void {
  loop.paused = !loop.paused;
  ppLabel.textContent = loop.paused ? "Play" : "Pause";
}
playPause.addEventListener("click", togglePause);

// Speed control (#13): fast-forward the sim without touching the step size, so
// higher speeds pass through identical states — just more of them per second.
// The loop outlives resets, so the chosen speed carries over. Pause still halts
// stepping and the loop's max-steps-per-frame guard still bounds an 8x frame.
const SPEED_LEVELS = [1, 2, 4, 8];
const speedButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("#speeds button"),
];
function selectSpeed(speed: number): void {
  loop.speed = speed;
  for (const button of speedButtons) {
    button.classList.toggle("active", Number(button.dataset.speed) === speed);
  }
}
/** Move up/down the discrete speed ladder for the +/− shortcuts, clamping at the ends. */
function stepSpeed(direction: 1 | -1): void {
  const current = SPEED_LEVELS.indexOf(loop.speed);
  const next = Math.min(Math.max(current + direction, 0), SPEED_LEVELS.length - 1);
  selectSpeed(SPEED_LEVELS[next]);
}
for (const button of speedButtons) {
  button.addEventListener("click", () => selectSpeed(Number(button.dataset.speed)));
}
selectSpeed(loop.speed);

// Reset: rebuild the world with a fresh random seed — all ants back at the
// nest, the pheromone field cleared, tick 0, and the default food source
// respawned in a new random direction (its bearing is drawn from the seed).
// The run is still reproducible: the status bar shows the new seed. The current
// slider params carry over (World copies them), so a tuned colony restarts
// with its tuning intact. Renders next frame even while paused.
function resetWorld(): void {
  world = new World(CONFIG, (Math.random() * 0x100000000) >>> 0, world.params);
  renderer = new Renderer(canvas, world);
}
reset.addEventListener("click", resetWorld);

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

// Keyboard shortcuts (#14): drive the exact same functions the buttons call, so
// button state (pause label, active tool/speed) stays in sync for free.
window.addEventListener("keydown", (event) => {
  // Leave browser/OS chords (Ctrl+R reload, etc.) alone.
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  // Don't hijack keys while a form control has focus — sliders use arrows, and a
  // future text field would need its characters. Buttons are fair game.
  const target = event.target as HTMLElement | null;
  const tag = target?.tagName;
  if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || target?.isContentEditable) {
    return;
  }
  switch (event.key) {
    case " ":
      // Suppress the native Space-activates-focused-button click so pausing via a
      // focused Pause button + Space toggles once, not twice.
      event.preventDefault();
      togglePause();
      break;
    case "r":
    case "R":
      resetWorld();
      break;
    case "1": selectTool("nest"); break;
    case "2": selectTool("food"); break;
    case "3": selectTool("erase"); break;
    case "+":
    case "=": stepSpeed(1); break;
    case "-":
    case "_": stepSpeed(-1); break;
    default: return;
  }
});

// Placement via pointer (#8, #15). Press-and-drag paints with the active tool:
// Erase wipes continuously along the path, Food drops distinct sources throttled
// by a minimum spacing so a drag lays a trail instead of stacking hundreds. Nest
// is placed once on press — there is one nest and dragging it is a separate feature.
const FOOD_PAINT_SPACING = 24; // px between dragged Food drops; > ERASE_RADIUS keeps blobs distinct

// Map a pointer event to field coordinates, correcting for any CSS scaling.
function eventToField(event: PointerEvent): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height,
  };
}

let stroking = false;
let lastFoodDrop: { x: number; y: number } | null = null;

function paintAt(x: number, y: number): void {
  if (tool === "erase") {
    world.eraseAt(x, y);
  } else if (tool === "food") {
    // Throttle by distance so a fast drag doesn't stack sources every frame.
    if (lastFoodDrop && Math.hypot(x - lastFoodDrop.x, y - lastFoodDrop.y) < FOOD_PAINT_SPACING) {
      return;
    }
    world.addFoodSource(x, y, placement.foodSize);
    lastFoodDrop = { x, y };
  }
}

canvas.addEventListener("pointerdown", (event) => {
  const { x, y } = eventToField(event);
  if (tool === "nest") {
    world.moveNest(x, y); // click-only: place once, no dragging
    return;
  }
  stroking = true;
  lastFoodDrop = null; // fresh stroke: the first Food drop always lands
  paintAt(x, y);
});

// Show the ghost preview under the cursor (#16), and paint along the drag. No
// pointer capture, so leaving the canvas simply stops the events (pausing the
// stroke); dragging back in with the button still held resumes it. `buttons & 1`
// guards against a stroke that began off-canvas.
canvas.addEventListener("pointermove", (event) => {
  const { x, y } = eventToField(event);
  renderer.preview = { tool, x, y, foodSize: placement.foodSize };
  if (!stroking || (event.buttons & 1) === 0) return;
  paintAt(x, y);
});

// The preview vanishes when the pointer leaves the canvas.
canvas.addEventListener("pointerleave", () => {
  renderer.preview = null;
});

// End the stroke on release anywhere — including outside the canvas.
window.addEventListener("pointerup", () => {
  stroking = false;
});

// Parameter sliders (#10): behavioural params affect the running sim the instant
// they change, because World reads world.params live every step and sliders write
// straight into it. Ant count and next-food-size need dedicated setters instead.
// Only the five sliders with a big, legible, immediate visual payoff are exposed
// (#18). The tuning knobs (diffusion, sensor distance/angle, trail reach) were
// benchmark-dialled and mostly just degrade the sim if touched, so they stay at
// their DEFAULT_PARAMS values instead of cluttering the panel.
interface SliderSpec {
  label: string;
  /** One-line "what dragging this does" descriptor shown under the label. */
  hint: string;
  min: number;
  max: number;
  step: number;
  /** Tuned default (the value at load); what the Reset-sliders button restores. */
  value: number;
  /** Apply a new value to the sim; called on every input event. */
  apply: (value: number) => void;
}

const sliders: SliderSpec[] = [
  { label: "Ant count", hint: "more ants, more life", min: 0, max: 1000, step: 10,
    value: world.params.antCount, apply: (v) => world.setAntCount(v) },
  { label: "Wander", hint: "order ↔ chaos", min: 0, max: 1, step: 0.05,
    value: world.params.wander, apply: (v) => { world.params.wander = v; } },
  { label: "Evaporation", hint: "trails linger ↔ vanish", min: 0, max: 0.1, step: 0.005,
    value: world.params.evaporation, apply: (v) => { world.params.evaporation = v; } },
  { label: "Deposit strength", hint: "faint ↔ bold trails", min: 0, max: 1, step: 0.05,
    value: world.params.depositStrength, apply: (v) => { world.params.depositStrength = v; } },
  { label: "Next food size", hint: "crumbs in the next drop", min: 50, max: 1000, step: 50,
    value: placement.foodSize, apply: (v) => { placement.foodSize = v; } },
];

const sliderPanel = document.querySelector<HTMLDivElement>("#sliders")!;
// Each slider drives sim, readout, and thumb through one `set` path, so the
// Reset-sliders button (#17) can restore a default exactly as a manual drag —
// special cases (ant count's setter, next-food-size's placement state) included.
const restoreDefaults: (() => void)[] = [];
for (const spec of sliders) {
  const label = document.createElement("label");
  const name = document.createElement("span");
  name.textContent = spec.label;
  const hint = document.createElement("small");
  hint.textContent = spec.hint;
  const value = document.createElement("output");
  const input = document.createElement("input");
  input.type = "range";
  input.min = String(spec.min);
  input.max = String(spec.max);
  input.step = String(spec.step);
  const set = (v: number): void => {
    input.value = String(v);
    value.textContent = input.value;
    spec.apply(v);
  };
  set(spec.value);
  input.addEventListener("input", () => set(Number(input.value)));
  restoreDefaults.push(() => set(spec.value));
  label.append(name, value, hint, input);
  sliderPanel.append(label);
}

// Reset sliders (#17): restore every param to its tuned default in one click,
// each through its own apply path. The world itself is untouched — ants, field,
// food, tick, and the collected tally all carry on. Works mid-run and paused.
const resetSliders = document.createElement("button");
resetSliders.type = "button";
resetSliders.id = "reset-sliders";
resetSliders.textContent = "Reset sliders to defaults";
resetSliders.addEventListener("click", () => {
  for (const restore of restoreDefaults) restore();
});
sliderPanel.append(resetSliders);

loop.start();
