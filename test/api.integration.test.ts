import { beforeAll, afterAll, describe, expect, test } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { createServer } from "node:net";

import { telemetry } from "./fixtures/telemetry";

function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.on("error", reject);
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address();
      if (!addr || typeof addr === "string") return reject(new Error("Failed to get free port"));
      const port = addr.port;
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

async function waitForHealthy(baseUrl: string, timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  let lastErr: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/`);
      if (res.ok) return;
      lastErr = new Error(`Non-200: ${res.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  throw lastErr instanceof Error ? lastErr : new Error("Server did not become healthy");
}

describe("API integration (real HTTP)", () => {
  let port: number;
  let baseUrl: string;
  let proc: ChildProcess | undefined;

  beforeAll(async () => {
    port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;

    proc = spawn(
      "bun",
      ["run", "index.ts"],
      {
        cwd: process.cwd(),
        env: { ...process.env, PORT: String(port) },
        stdio: "ignore",
      }
    );

    await waitForHealthy(baseUrl);
  });

  afterAll(async () => {
    if (proc && !proc.killed) proc.kill("SIGKILL");
  });

  test("GET /laps before ingest returns 400", async () => {
    const res = await fetch(`${baseUrl}/laps`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "No data. POST telemetry to /ingest first." });
  });

  test("GET /analysis before ingest returns 400", async () => {
    const res = await fetch(`${baseUrl}/analysis`);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "No data. POST telemetry to /ingest first." });
  });

  test("POST /ingest invalid JSON returns INVALID_JSON", async () => {
    const res = await fetch(`${baseUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ code: "INVALID_JSON", error: "Invalid JSON body" });
  });

  test("POST /ingest invalid telemetry returns INVALID_TELEMETRY", async () => {
    const res = await fetch(`${baseUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([{ ts: 0 }]),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe("INVALID_TELEMETRY");
    expect(body.error).toBe("Invalid telemetry payload");
    expect(Array.isArray(body.details)).toBe(true);
  });

  test("end-to-end: ingest telemetry then validate /laps and /analysis outputs", async () => {
    const ingest = await fetch(`${baseUrl}/ingest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(telemetry),
    });
    expect(ingest.status).toBe(200);
    expect(await ingest.json()).toEqual({ laps: 3, frames: 163 });

    const laps = await fetch(`${baseUrl}/laps`);
    expect(laps.status).toBe(200);
    expect(await laps.json()).toEqual([
      {
        lapNumber: 1,
        lapTime: 133.2,
        sectors: [
          { sector: 1, time: 43.6 },
          { sector: 2, time: 47.4 },
          { sector: 3, time: 42.2 },
        ],
        avgSpeed: 227.9,
        maxSpeed: 291,
      },
      {
        lapNumber: 2,
        lapTime: 132.8,
        sectors: [
          { sector: 1, time: 42.953 },
          { sector: 2, time: 47.147 },
          { sector: 3, time: 42.7 },
        ],
        avgSpeed: 230.6,
        maxSpeed: 292,
      },
      {
        lapNumber: 3,
        lapTime: 137.4,
        sectors: [
          { sector: 1, time: 44.422 },
          { sector: 2, time: 50.973 },
          { sector: 3, time: 42.005 },
        ],
        avgSpeed: 217.5,
        maxSpeed: 286,
      },
    ]);

    const analysis = await fetch(`${baseUrl}/analysis`);
    expect(analysis.status).toBe(200);
    expect(await analysis.json()).toEqual({
      bestLap: { lapNumber: 2, lapTime: 132.8 },
      worstLap: { lapNumber: 3, lapTime: 137.4, delta: 4.6 },
      problemSector: 2,
      issue: "tyre_overheat",
      coachingMessage:
        "Sector 2 is costing you +3.8s. Front right hit 119°C — tyre is cooked. You're overdriving the entry and destroying what's left. Back off 20 metres earlier. Let the temps come down.",
    });
  });
});

