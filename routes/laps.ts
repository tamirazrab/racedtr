import { Hono } from "hono";
import { store } from "../store";
import {
  getCompletedLapNumbers,
  getFramesForLap,
  getLapStartTimestamps,
} from "../lap-builder";
import { computeSectorTimes } from "../sector-analyzer";

const router = new Hono();

router.get("/", (c) => {
  const frames = store.getFrames();
  if (frames.length === 0) {
    return c.json({ error: "No data. POST telemetry to /ingest first." }, 400);
  }

  const completedLaps = getCompletedLapNumbers(frames);
  const lapStartTs = getLapStartTimestamps(frames);

  const summaries = completedLaps.map(lapNum => {
    const lapFrames = getFramesForLap(frames, lapNum);
    const startTs = lapStartTs.get(lapNum)!;
    const endTs = lapStartTs.get(lapNum + 1)!;
    const speeds = lapFrames.map(f => f.spd);

    return {
      lapNumber: lapNum,
      lapTime: Math.round((endTs - startTs) * 1000) / 1000,
      sectors: computeSectorTimes(lapFrames, startTs, endTs),
      avgSpeed: Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length * 10) / 10,
      maxSpeed: Math.max(...speeds),
    };
  });

  return c.json(summaries);
});

export default router;