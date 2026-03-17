import type { TelemetryFrame } from "./types";

type Issue = "heavy_braking" | "low_throttle" | "tyre_overheat" | "inconsistency";

function stddev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Checks are ordered by causality, not just spec order.
 * Tyre overheat is the root cause when present — heavy braking and low throttle
 * that follow are symptoms of lost grip, not independent problems.
 */
export function detectIssue(frames: TelemetryFrame[]): Issue {
  const allTemps = frames.flatMap(f => [f.tyres.fl, f.tyres.fr, f.tyres.rl, f.tyres.rr]);
  if (allTemps.some(t => t > 110)) return "tyre_overheat";

  if (frames.some(f => f.brk > 0.8 && f.spd > 200)) return "heavy_braking";

  if (stddev(frames.map(f => f.spd)) > 40) return "inconsistency";

  const avgThrottle = frames.reduce((sum, f) => sum + f.thr, 0) / frames.length;
  if (avgThrottle < 0.6) return "low_throttle";

  return "inconsistency";
}

export function getIssueStats(frames: TelemetryFrame[]) {
  return {
    maxTyreTemp: Math.max(...frames.flatMap(f => [f.tyres.fl, f.tyres.fr, f.tyres.rl, f.tyres.rr])),
    maxFR: Math.max(...frames.map(f => f.tyres.fr)),
    peakBrake: Math.max(...frames.map(f => f.brk)),
    avgThrottle: frames.reduce((s, f) => s + f.thr, 0) / frames.length,
    speedStddev: stddev(frames.map(f => f.spd)),
    minSpeed: Math.min(...frames.map(f => f.spd)),
  };
}