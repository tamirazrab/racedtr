import { describe, expect, test } from "vitest";
import { computeSectorTimes } from "../solutions/hard/domain/sector-analyzer";
import { getFramesForLap, getLapStartTimestamps } from "../solutions/hard/domain/lap-builder";
import { telemetry } from "./fixtures/telemetry";

describe("sector-analyzer", () => {
  test("computes sector times for lap 2 matching expected output", () => {
    const starts = getLapStartTimestamps(telemetry);
    const lapNum = 2;
    const lapFrames = getFramesForLap(telemetry, lapNum);
    const startTs = starts.get(lapNum)!;

    /* Only stores first timestamps for each lap - that's why fetching the next lap's start timestamp */
    const endTs = starts.get(lapNum + 1)!;

    const sectors = computeSectorTimes(lapFrames, startTs, endTs);
    expect(sectors).toEqual([
      { sector: 1, time: 42.953 },
      { sector: 2, time: 47.147 },
      { sector: 3, time: 42.7 },
    ]);
  });

  test("falls back to single sector when crossings are missing", () => {
    const lapFrames = [
      // Never crosses 0.333 or 0.667
      { ts: 0, lap: 1, pos: 0.1, spd: 0, thr: 0, brk: 0, str: 0, gear: 1, rpm: 0, tyres: { fl: 0, fr: 0, rl: 0, rr: 0 } },
      { ts: 1, lap: 1, pos: 0.2, spd: 0, thr: 0, brk: 0, str: 0, gear: 1, rpm: 0, tyres: { fl: 0, fr: 0, rl: 0, rr: 0 } },
    ];

    const sectors = computeSectorTimes(lapFrames as any, 0, 10);
    expect(sectors).toEqual([{ sector: 1, time: 10 }]);
  });
});

