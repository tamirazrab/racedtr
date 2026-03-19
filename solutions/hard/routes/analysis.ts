import { Hono } from "hono";
import { store } from "../state/store";
import {
  getCompletedLapNumbers,
  getFramesForLap,
  getLapStartTimestamps,
} from "../domain/lap-builder";
import { computeSectorTimes } from "../domain/sector-analyzer";
import { detectIssue, getIssueStats } from "../domain/issue-detector";

const router = new Hono();

const SECTOR_RANGES = [
  { sector: 1, start: 0.0, end: 0.333 },
  { sector: 2, start: 0.333, end: 0.667 },
  { sector: 3, start: 0.667, end: 1.0 },
];

router.get("/", (c) => {
  const frames = store.getFrames();
  if (frames.length === 0) {
    return c.json({ error: "No data. POST telemetry to /ingest first." }, 400);
  }

  const completedLaps = getCompletedLapNumbers(frames);
  if (completedLaps.length < 2) {
    return c.json({ error: "Need at least 2 completed laps for analysis." }, 400);
  }

  const lapStartTs = getLapStartTimestamps(frames);

  const lapData = completedLaps.map((lapNum) => {
    const lapFrames = getFramesForLap(frames, lapNum);
    const startTs = lapStartTs.get(lapNum)!;
    const endTs = lapStartTs.get(lapNum + 1)!;
    return {
      lapNumber: lapNum,
      lapTime: endTs - startTs,
      sectors: computeSectorTimes(lapFrames, startTs, endTs),
      frames: lapFrames,
    };
  });

  const bestLap = lapData.reduce((a, b) => (a.lapTime < b.lapTime ? a : b));
  const worstLap = lapData.reduce((a, b) => (a.lapTime > b.lapTime ? a : b));

  // Find which sector lost the most time in the worst lap vs the best lap
  const sectorDeltas = worstLap.sectors.map((s, i) => {
    const bestSectorTime = bestLap.sectors[i]?.time ?? s.time;
    return { sector: s.sector, delta: s.time - bestSectorTime };
  });

  const problemSectorEntry = sectorDeltas.reduce((a, b) => (a.delta > b.delta ? a : b));
  const { start, end } = SECTOR_RANGES[problemSectorEntry.sector - 1];

  const sectorFrames = worstLap.frames.filter((f) => f.pos >= start && f.pos < end);

  const issue = detectIssue(sectorFrames);
  const stats = getIssueStats(sectorFrames);

  return c.json({
    bestLap: {
      lapNumber: bestLap.lapNumber,
      lapTime: Math.round(bestLap.lapTime * 1000) / 1000,
    },
    worstLap: {
      lapNumber: worstLap.lapNumber,
      lapTime: Math.round(worstLap.lapTime * 1000) / 1000,
      delta: Math.round((worstLap.lapTime - bestLap.lapTime) * 1000) / 1000,
    },
    problemSector: problemSectorEntry.sector,
    issue,
    coachingMessage: buildCoachingMessage(
      issue,
      problemSectorEntry.sector,
      problemSectorEntry.delta,
      stats
    ),
  });
});

function buildCoachingMessage(
  issue: string,
  sector: number,
  delta: number,
  stats: ReturnType<typeof getIssueStats>
): string {
  const d = `+${delta.toFixed(1)}s`;

  switch (issue) {
    case "tyre_overheat":
      return (
        `Sector ${sector} is costing you ${d}. ` +
        `Front right hit ${stats.maxFR.toFixed(0)}°C — tyre is cooked. ` +
        `You're overdriving the entry and destroying what's left. ` +
        `Back off 20 metres earlier. Let the temps come down.`
      );
    case "heavy_braking":
      return (
        `Sector ${sector}, you're losing ${d} under braking. ` +
        `Peak at ${(stats.peakBrake * 100).toFixed(0)}% pressure and you're still carrying speed. ` +
        `Move the braking point back. Smooth release into the corner.`
      );
    case "low_throttle":
      return (
        `Sector ${sector} is soft — ${d} down. ` +
        `Average throttle is ${(stats.avgThrottle * 100).toFixed(0)}%. ` +
        `You're hesitating on exit and leaving it on the table. ` +
        `Earlier power application. Commit to it.`
      );
    case "inconsistency":
      return (
        `Sector ${sector} is inconsistent — ${d} off. ` +
        `Speed variance is ${stats.speedStddev.toFixed(0)} km/h stddev, dropping to ${stats.minSpeed} in places. ` +
        `No fixed reference point. Pick a marker and commit to it every lap.`
      );
    default:
      return `Sector ${sector} needs attention — ${d} off the best lap.`;
  }
}

export default router;

