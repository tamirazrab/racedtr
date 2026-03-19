import { Hono } from "hono";
import { store } from "../state/store";
import { filterStationary, getCompletedLapNumbers } from "../domain/lap-builder";
import { formatArkErrors, isArkErrors, TelemetryFramesSchema } from "../schemas/telemetry";

const router = new Hono();

router.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ code: "INVALID_JSON", error: "Invalid JSON body" }, 400);
  }

  const parsed = TelemetryFramesSchema(body);
  if (isArkErrors(parsed)) {
    return c.json(
      {
        code: "INVALID_TELEMETRY",
        error: "Invalid telemetry payload",
        details: formatArkErrors(parsed).slice(0, 20),
      },
      400
    );
  }

  const filtered = filterStationary(parsed);
  store.ingest(filtered);

  const completedLaps = getCompletedLapNumbers(filtered);

  return c.json({
    laps: completedLaps.length,
    frames: filtered.length,
  });
});

export default router;

