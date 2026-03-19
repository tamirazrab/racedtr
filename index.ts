import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { config } from "./config";
import { hardApp } from "./solutions/hard/app";

export const app = new Hono();

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json(
      { code: "REQUEST_ERROR", error: err.message },
      err.status
    );
  }
  return c.json({ code: "INTERNAL", error: "Internal Server Error" }, 500);
});

app.notFound((c) => c.json({ code: "NOT_FOUND", error: "Not Found" }, 404));

app.get("/", (c) => c.json({ status: "PitGPT telemetry API — online" }));

app.route("/", hardApp);

export type AppType = typeof app;

export default {
  port: config.port,
  fetch: app.fetch,
};

