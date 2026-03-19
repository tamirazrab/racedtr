## PitGPT Telemetry Analysis Service

PitGPT Telemetry Analysis Service ingests high‑frequency simulator telemetry and produces lap summaries and coaching insights.


### Architecture Overview

- **HTTP API (Bun + Hono)**
  - `POST /ingest` — ingest raw telemetry frames (stores in memory)
  - `GET /laps` — compute per‑lap summaries
  - `GET /analysis` — compare laps, find worst sector on worst lap, emit primary issue + coaching message
- **Domain modules**
  - `lap-builder.ts` — stationary filtering, lap slicing/timing helpers
  - `sector-analyzer.ts` — sector timing with boundary crossing interpolation
  - `issue-detector.ts` — heuristics to classify primary issue
- **State**
  - `store.ts` — process‑local in‑memory storage (single global dataset)

### Setup

#### Prerequisites

- Bun installed (latest stable)

#### Install

```bash
bun install
```

### Run Locally

Run the server (entrypoint is `index.ts` which exports `{ port, fetch }`):

```bash
bun run index.ts
```

Service starts on `http://localhost:3000`.

### Try It (curl)

Generate a `telemetry.json` payload from the bundled dataset:

```bash
bun -e "import { telemetry } from './solutions/hard/hard.question'; await Bun.write('telemetry.json', JSON.stringify(telemetry)); console.log('wrote', telemetry.length)"
```

Hit every route:

```bash
curl -s "http://127.0.0.1:3000/"
curl -s -X POST "http://127.0.0.1:3000/ingest" -H "Content-Type: application/json" --data-binary "@telemetry.json"
curl -s "http://127.0.0.1:3000/laps"
curl -s "http://127.0.0.1:3000/analysis"
```

Example output (captured from a local run against the included `hard.question.ts` dataset):

```text
curl -s "http://127.0.0.1:3000/"
{"status":"PitGPT telemetry API — online"}

curl -s -X POST "http://127.0.0.1:3000/ingest" -H "Content-Type: application/json" --data-binary "@telemetry.json"
{"laps":3,"frames":163}

curl -s "http://127.0.0.1:3000/laps"
[{"lapNumber":1,"lapTime":133.2,"sectors":[{"sector":1,"time":43.6},{"sector":2,"time":47.4},{"sector":3,"time":42.2}],"avgSpeed":227.9,"maxSpeed":291},{"lapNumber":2,"lapTime":132.8,"sectors":[{"sector":1,"time":42.953},{"sector":2,"time":47.147},{"sector":3,"time":42.7}],"avgSpeed":230.6,"maxSpeed":292},{"lapNumber":3,"lapTime":137.4,"sectors":[{"sector":1,"time":44.422},{"sector":2,"time":50.973},{"sector":3,"time":42.005}],"avgSpeed":217.5,"maxSpeed":286}]

curl -s "http://127.0.0.1:3000/analysis"
{"bestLap":{"lapNumber":2,"lapTime":132.8},"worstLap":{"lapNumber":3,"lapTime":137.4,"delta":4.6},"problemSector":2,"issue":"tyre_overheat","coachingMessage":"Sector 2 is costing you +3.8s. Front right hit 119°C — tyre is cooked. You're overdriving the entry and destroying what's left. Back off 20 metres earlier. Let the temps come down."}
```

### API

#### POST `/ingest`

Ingest a telemetry array and store it in memory.

- **Body**: JSON array of `TelemetryFrame` objects (see `types.ts`)
- **200 OK**

```json
{ "laps": 3, "frames": 163 }
```

- **400 Bad Request** (examples)

```json
{ "error": "Invalid JSON body" }
```

```json
{ "error": "Expected a non-empty array of telemetry frames" }
```

#### GET `/laps`

Returns a summary of each completed lap.

- **200 OK**

```json
[
  {
    "lapNumber": 1,
    "lapTime": 133.2,
    "sectors": [
      { "sector": 1, "time": 43.6 },
      { "sector": 2, "time": 47.4 },
      { "sector": 3, "time": 42.2 }
    ],
    "avgSpeed": 227.9,
    "maxSpeed": 291
  },
  {
    "lapNumber": 2,
    "lapTime": 132.8,
    "sectors": [
      { "sector": 1, "time": 42.953 },
      { "sector": 2, "time": 47.147 },
      { "sector": 3, "time": 42.7 }
    ],
    "avgSpeed": 230.6,
    "maxSpeed": 292
  },
  {
    "lapNumber": 3,
    "lapTime": 137.4,
    "sectors": [
      { "sector": 1, "time": 44.422 },
      { "sector": 2, "time": 50.973 },
      { "sector": 3, "time": 42.005 }
    ],
    "avgSpeed": 217.5,
    "maxSpeed": 286
  }
]
```

#### GET `/analysis`

Compares laps to the best lap, finds the worst lap, then identifies which sector lost the most time (worst sector vs best lap). On that sector of the worst lap, it detects a primary issue and emits a PitGPT‑style coaching message.

- **200 OK**

```json
{
  "bestLap": { "lapNumber": 2, "lapTime": 132.8 },
  "worstLap": { "lapNumber": 3, "lapTime": 137.4, "delta": 4.6 },
  "problemSector": 2,
  "issue": "tyre_overheat",
  "coachingMessage": "Sector 2 is costing you +3.8s. Front right hit 119°C — tyre is cooked. You're overdriving the entry and destroying what's left. Back off 20 metres earlier. Let the temps come down."
}
```

### Design Decisions and Tradeoffs

- **In‑memory store (`store.ts`)**
  - Not safe for multi‑user use, not horizontally scalable, data is lost on restart.
- **Hard‑coded thresholds**
  - Sector boundaries (`0.333`, `0.667`) and detection thresholds are embedded in code for simplicity.
  - A production service would move these to configuration and/or track profiles.

### How to Run Tests

Run unit + integration tests (includes real-HTTP integration tests):

```bash
bun run test
```

Typecheck:

```bash
bun run typecheck
```