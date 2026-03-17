import { Hono } from "hono";
import type { TelemetryFrame } from "../types";
import { store } from "../store";
import { filterStationary, getCompletedLapNumbers } from "../lap-builder";

const router = new Hono();

router.post("/", async (c) => {
  let body: TelemetryFrame[];
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!Array.isArray(body) || body.length === 0) {
    return c.json({ error: "Expected a non-empty array of telemetry frames" }, 400);
  }

  const filtered = filterStationary(body);
  store.ingest(filtered);

  const completedLaps = getCompletedLapNumbers(filtered);

  return c.json({
    laps: completedLaps.length,
    frames: filtered.length,
  });
});

export default router;