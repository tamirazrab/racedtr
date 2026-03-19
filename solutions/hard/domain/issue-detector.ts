import { config } from "../../../config";
import type { TelemetryFrame } from "../types/telemetry";

type Issue =
  | "heavy_braking"
  | "low_throttle"
  | "tyre_overheat"
  | "inconsistency";

function stddev(speeds: number[]): number {
  if (speeds.length === 0) return 0;

  const avgSpeed = speeds.reduce((total, speed) => total + speed, 0) / speeds.length;

  const avgSpeedSquaredDeviation =
    speeds.reduce((total, speed) => total + (speed - avgSpeed) ** 2, 0) / speeds.length;

  return Math.sqrt(avgSpeedSquaredDeviation);
}

/**
 * Checks are ordered by causality, not just spec order.
 * Tyre overheat is the root cause when present — heavy braking and low throttle
 * that follow are symptoms of lost grip, not independent problems.
 */
export function detectIssue(frames: TelemetryFrame[]): Issue {
  const { tyreOverheatC, heavyBraking, inconsistencySpeedStddevKmh, lowThrottleAvg } =
    config.issueDetection;
  const stats = getIssueStats(frames);

  if (stats.maxTyreTemp > tyreOverheatC) return "tyre_overheat";

  if (
    frames.some(
      (f) => f.brk > heavyBraking.brakeMin && f.spd > heavyBraking.speedMinKmh
    )
  )
    return "heavy_braking";

  if (stats.speedStddev > inconsistencySpeedStddevKmh) return "inconsistency";

  if (stats.avgThrottle < lowThrottleAvg) return "low_throttle";

  return "inconsistency";
}

export function getIssueStats(frames: TelemetryFrame[]) {
  const allTyreTemps = frames.flatMap((f) => [
    f.tyres.fl,
    f.tyres.fr,
    f.tyres.rl,
    f.tyres.rr,
  ]);
  const speeds = frames.map((f) => f.spd);

  return {
    maxTyreTemp: Math.max(...allTyreTemps),
    maxFR: Math.max(...frames.map((f) => f.tyres.fr)),
    peakBrake: Math.max(...frames.map((f) => f.brk)),
    avgThrottle: frames.reduce((s, f) => s + f.thr, 0) / Math.max(1, frames.length),
    speedStddev: stddev(speeds),
    minSpeed: Math.min(...speeds),
  };
}

