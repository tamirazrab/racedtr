import type { TelemetryFrame, SectorSummary } from "../types/telemetry";

const SECTOR_BOUNDARIES = [0.333, 0.667] as const;

/*
  *  |----S1----|----S2----|----S3----|
  *  0.0      0.333      0.667      1.0
  *
  *  Example frames to interpolate for:
  *    ts: 101.2, pos: 0.318   ← just before boundary
  *    ts: 104.4, pos: 0.338   ← just after boundary
*/
function interpolateBoundaryCrossingTime(
  before: TelemetryFrame,
  after: TelemetryFrame,
  boundaryPos: number
): number {
  /*
    * Total position gap  = 0.338 - 0.318 = 0.020
    * We need to cover   = 0.333 - 0.318 = 0.015
  */
  const totalPositionGap = after.pos - before.pos;
  const gapNeededToCover = boundaryPos - before.pos;

  if (totalPositionGap === 0) return after.ts;

  /*
    * Fraction of the way = 0.015 / 0.020 = 0.75
  */
  const fractionOfTotalPositionGap = gapNeededToCover / totalPositionGap;

  /*
    * Total time gap = 104.4 - 101.2 = 3.2 seconds
    * 75% of 3.2 = 2.4 seconds
    * Crossing time = 101.2 + 2.4 = 103.6 seconds
  */
  const totalTimeGap = after.ts - before.ts;
  return before.ts + fractionOfTotalPositionGap * totalTimeGap;
}

function findBoundaryCrossingTime(
  lapFrames: TelemetryFrame[],
  boundaryPos: number
): number | undefined {
  for (let i = 0; i < lapFrames.length - 1; i++) {
    const before = lapFrames[i];
    const after = lapFrames[i + 1];

    if (before.pos <= boundaryPos && after.pos > boundaryPos) {
      return interpolateBoundaryCrossingTime(before, after, boundaryPos);
    }
  }

  return undefined;
}

export function computeSectorTimes(
  lapFrames: TelemetryFrame[],
  lapStartTs: number,
  lapEndTs: number
): SectorSummary[] {
  const crossingTimes = SECTOR_BOUNDARIES.map((boundaryPos) =>
    findBoundaryCrossingTime(lapFrames, boundaryPos)
  );
  const [s1ToS2Crossing, s2ToS3Crossing] = crossingTimes;

  if (s1ToS2Crossing === undefined || s2ToS3Crossing === undefined) {
    return [{ sector: 1, time: round(lapEndTs - lapStartTs) }];
  }

  return [
    { sector: 1, time: round(s1ToS2Crossing - lapStartTs) },
    { sector: 2, time: round(s2ToS3Crossing - s1ToS2Crossing) },
    { sector: 3, time: round(lapEndTs - s2ToS3Crossing) },
  ];
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

