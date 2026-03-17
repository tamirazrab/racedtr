import type { TelemetryFrame, SectorSummary } from "./types";

const SECTOR_BOUNDARIES = [0.333, 0.667] as const;

/**
 * Linearly interpolate the exact timestamp when the car crossed a position boundary.
 * Using nearest frame would introduce up to ~half a frame (~0.05s at 10 Hz) of error.
 */
function interpolateCrossing(
  f1: TelemetryFrame,
  f2: TelemetryFrame,
  boundary: number
): number {
  const t = (boundary - f1.pos) / (f2.pos - f1.pos);
  return f1.ts + t * (f2.ts - f1.ts);
}

export function computeSectorTimes(
  lapFrames: TelemetryFrame[],
  lapStartTs: number,
  lapEndTs: number
): SectorSummary[] {
  const crossings: number[] = [];

  for (const boundary of SECTOR_BOUNDARIES) {
    for (let i = 0; i < lapFrames.length - 1; i++) {
      const f1 = lapFrames[i];
      const f2 = lapFrames[i + 1];
      if (f1.pos <= boundary && f2.pos > boundary) {
        crossings.push(interpolateCrossing(f1, f2, boundary));
        break;
      }
    }
  }

  if (crossings.length !== 2) {
    // Lap didn't contain both sector crossings — return full lap as S1 only
    return [{ sector: 1, time: round(lapEndTs - lapStartTs) }];
  }

  return [
    { sector: 1, time: round(crossings[0] - lapStartTs) },
    { sector: 2, time: round(crossings[1] - crossings[0]) },
    { sector: 3, time: round(lapEndTs - crossings[1]) },
  ];
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}