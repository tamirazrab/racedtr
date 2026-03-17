import { Hono } from "hono";
import ingestRouter from "./routes/ingest";
import lapsRouter from "./routes/laps";
import analysisRouter from "./routes/analysis";

const app = new Hono();

app.route("/ingest", ingestRouter);
app.route("/laps", lapsRouter);
app.route("/analysis", analysisRouter);

app.get("/", (c) => c.json({ status: "PitGPT telemetry API — online" }));

export default {
  port: 3000,
  fetch: app.fetch,
};
