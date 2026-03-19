import { Hono } from "hono";
import ingestRouter from "./routes/ingest";
import lapsRouter from "./routes/laps";
import analysisRouter from "./routes/analysis";

export const hardApp = new Hono();

hardApp.route("/ingest", ingestRouter);
hardApp.route("/laps", lapsRouter);
hardApp.route("/analysis", analysisRouter);

export type HardAppType = typeof hardApp;

