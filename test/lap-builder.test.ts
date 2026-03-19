import { describe, expect, test } from "vitest";
import {
  filterStationary,
  getCompletedLapNumbers,
  getFramesForLap,
  getLapStartTimestamps,
} from "../solutions/hard/domain/lap-builder";
import { telemetry } from "./fixtures/telemetry";

describe("lap-builder", () => {
  test("filterStationary drops stationary frames (spd<5 and pos unchanged)", () => {
    const filtered = filterStationary(telemetry);

    /*
      * Race data includes 3 stationary frames  (spd < 5 and pos unchanged) at the end 
         * ts: 503.4, 
         * ts: 504.4, 
         * ts: 505.4
      * These should be filtered out by filterStationary
    */
    expect(filtered.some((f) => f.ts === 503.4)).toBe(false);
    expect(filtered.some((f) => f.ts === 504.4)).toBe(false);
    expect(filtered.some((f) => f.ts === 505.4)).toBe(false);
  });

  test("getCompletedLapNumbers excludes out-lap (0) and final incomplete lap", () => {
    const completed = getCompletedLapNumbers(telemetry);
    expect(completed).toEqual([1, 2, 3]);
  });

  test("getLapStartTimestamps returns start ts per lap", () => {
    const map = getLapStartTimestamps(telemetry);
    expect(map.get(0)).toBe(0.0);
    expect(map.get(1)).toBe(60.0);
    expect(map.get(2)).toBe(193.2);
    expect(map.get(3)).toBe(326.0);
    expect(map.get(4)).toBe(463.4);
  });

  test("lap timing boundary (lap N ends at lap N+1 start)", () => {
    const completed = getCompletedLapNumbers(telemetry);
    const starts = getLapStartTimestamps(telemetry);

    const lap1Frames = getFramesForLap(telemetry, completed[0]);
    expect(lap1Frames.length).toBeGreaterThan(0);

    const lap1 = completed[0];
    const lap1Time = (starts.get(lap1 + 1)! - starts.get(lap1)!);
    // Expected from README output: 133.2
    expect(Math.round(lap1Time * 1000) / 1000).toBe(133.2);
  });
});

