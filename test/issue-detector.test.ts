import { describe, expect, test } from "vitest";
import { detectIssue } from "../solutions/hard/domain/issue-detector";
import { getFramesForLap } from "../solutions/hard/domain/lap-builder";
import { telemetry } from "./fixtures/telemetry";

describe("issue-detector", () => {
  test("returns tyre_overheat for lap 3 sector 2 frames", () => {
    const lap3 = getFramesForLap(telemetry, 3);
    // Sector 2 range per routes/analysis.ts: [0.333, 0.667)
    const sector2 = lap3.filter((f) => f.pos >= 0.333 && f.pos < 0.667);
    expect(detectIssue(sector2)).toBe("tyre_overheat");
  });

  test("priority: tyre_overheat beats heavy_braking", () => {
    const frames = [
      {
        ts: 0,
        lap: 1,
        pos: 0.4,
        spd: 250,
        thr: 1,
        brk: 0.9,
        str: 0,
        gear: 4,
        rpm: 8000,
        tyres: { fl: 120, fr: 90, rl: 90, rr: 90 },
      },
    ];
    expect(detectIssue(frames as any)).toBe("tyre_overheat");
  });
});

