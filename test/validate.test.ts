import { describe, expect, test } from "vitest";
import { TelemetryFramesSchema, isArkErrors } from "../solutions/hard/schemas/telemetry";
import { telemetry } from "./fixtures/telemetry";

describe("validate", () => {
  test("accepts challenge telemetry", () => {
    const out = TelemetryFramesSchema(telemetry);
    expect(isArkErrors(out)).toBe(false);
    expect(Array.isArray(out)).toBe(true);
  });

  test("rejects empty array", () => {
    const out = TelemetryFramesSchema([]);
    expect(isArkErrors(out)).toBe(true);
  });

  test("rejects out-of-range values", () => {
    const bad = [
      {
        ts: 0,
        lap: 0,
        pos: 2, // invalid
        spd: 0,
        thr: 0,
        brk: 0,
        str: 0,
        gear: 1,
        rpm: 0,
        tyres: { fl: 0, fr: 0, rl: 0, rr: 0 },
      },
    ];
    const out = TelemetryFramesSchema(bad);
    expect(isArkErrors(out)).toBe(true);
  });
});

