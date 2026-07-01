import { describe, it, expect } from "vitest";
import { PheromoneField, type Channel } from "./field.ts";
import { senseSteer, type Ant } from "./ant.ts";
import { DEFAULT_PARAMS } from "./params.ts";

/** An ant sitting mid-field, facing +x, so "front" is +x and "left" is −angle. */
function antFacingRight(): Ant {
  return {
    x: 60,
    y: 60,
    heading: 0,
    state: "searching",
    budget: 1,
    ticksSinceGoal: 0,
    escapeTicks: 0,
  };
}

/** World-space point of a sensor at `offset` radians from the ant's heading. */
function sensorPoint(ant: Ant, offset: number) {
  const { sensorDistance } = DEFAULT_PARAMS;
  return {
    x: ant.x + Math.cos(ant.heading + offset) * sensorDistance,
    y: ant.y + Math.sin(ant.heading + offset) * sensorDistance,
  };
}

/**
 * Deposit a 3×3 blob centred on a point. A blob (not a single cell) means the
 * sensor aimed at its centre fully covers it, while the neighbouring sensors —
 * whose patches only clip the blob — read strictly less, regardless of how the
 * sensor points quantise onto the grid.
 */
function depositBlob(f: PheromoneField, ch: Channel, x: number, y: number) {
  const { cellSize } = f;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      f.deposit(ch, x + dc * cellSize, y + dr * cellSize, 0.3);
    }
  }
}

describe("three-sensor steering", () => {
  const field = () => new PheromoneField(120, 120, 4);
  const { sensorAngle } = DEFAULT_PARAMS;

  it("turns toward the front-left sensor when its patch is strongest", () => {
    const f = field();
    const ant = antFacingRight();
    const p = sensorPoint(ant, -sensorAngle);
    depositBlob(f, "food", p.x, p.y);

    const { turn, strength } = senseSteer(f, ant, "food", DEFAULT_PARAMS);
    expect(turn).toBe(-sensorAngle);
    expect(strength).toBeGreaterThan(0);
  });

  it("turns toward the front-right sensor when its patch is strongest", () => {
    const f = field();
    const ant = antFacingRight();
    const p = sensorPoint(ant, sensorAngle);
    depositBlob(f, "food", p.x, p.y);

    const { turn } = senseSteer(f, ant, "food", DEFAULT_PARAMS);
    expect(turn).toBe(sensorAngle);
  });

  it("goes straight when the centre sensor is strongest", () => {
    const f = field();
    const ant = antFacingRight();
    const p = sensorPoint(ant, 0);
    depositBlob(f, "food", p.x, p.y);

    const { turn } = senseSteer(f, ant, "food", DEFAULT_PARAMS);
    expect(turn).toBe(0);
  });

  it("reports zero strength and a straight turn on a blank field", () => {
    const { turn, strength } = senseSteer(
      field(),
      antFacingRight(),
      "food",
      DEFAULT_PARAMS,
    );
    expect(turn).toBe(0);
    expect(strength).toBe(0);
  });

  it("follows only the requested channel", () => {
    const f = field();
    const ant = antFacingRight();
    // Home pheromone to the left must not steer a food-sensing ant.
    const p = sensorPoint(ant, -sensorAngle);
    depositBlob(f, "home", p.x, p.y);

    const { turn, strength } = senseSteer(f, ant, "food", DEFAULT_PARAMS);
    expect(turn).toBe(0);
    expect(strength).toBe(0);
  });
});
