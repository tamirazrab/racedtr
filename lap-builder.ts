import type { TelemetryFrame } from "./types";

const STATIONARY_SPD = 5;
const STATIONARY_POS_DELTA = 0.001;

/**
 * Drop frames where the car is stopped: speed < 5 km/h AND position isn't changing.
 * These are pit stop / red flag frames that would corrupt lap timing.
 */
export function filterStationary(frames: TelemetryFrame[]): TelemetryFrame[] {
  return frames.filter((f, i) => {
    if (f.spd >= STATIONARY_SPD) return true;
    const prev = frames[i - 1];
    const posDelta = prev ? Math.abs(f.pos - prev.pos) : 0;
    return posDelta > STATIONARY_POS_DELTA;
  });
}

/**
 * Returns lap numbers that are valid for analysis:
 * - Excludes lap 0 (out-lap, starts mid-track, tyres cold)
 * - Excludes the final lap (may be incomplete — only include if a subsequent lap exists,
 *   which confirms the car crossed start/finish to complete it)
 */
export function getCompletedLapNumbers(frames: TelemetryFrame[]): number[] {
  const allLaps = [...new Set(frames.map(f => f.lap))].sort((a, b) => a - b);
  const timed = allLaps.filter(n => n > 0);
  // Drop the last: no subsequent lap means we can't confirm it completed
  return timed.slice(0, -1);
}

export function getFramesForLap(
  frames: TelemetryFrame[],
  lapNum: number
): TelemetryFrame[] {
  return frames.filter(f => f.lap === lapNum);
}

/**
 * Returns the start timestamp for each lap number.
 *
 * The boundary frames in this data are shared: the same ts appears as the last
 * frame of lap N (near pos 1.0) and also as the first frame of lap N+1 (near pos 0.0).
 * Using the first frame of lap N+1 as the end timestamp for lap N correctly captures
 * the moment the car crossed start/finish.
 */
export function getLapStartTimestamps(
  frames: TelemetryFrame[]
): Map<number, number> {
  const allLaps = [...new Set(frames.map(f => f.lap))].sort((a, b) => a - b);
  const map = new Map<number, number>();
  for (const lap of allLaps) {
    const lapFrames = getFramesForLap(frames, lap);
    if (lapFrames.length > 0) map.set(lap, lapFrames[0].ts);
  }
  return map;
}