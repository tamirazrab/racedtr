import type { TelemetryFrame } from "../types/telemetry";

let frames: TelemetryFrame[] = [];

export const store = {
  ingest(incoming: TelemetryFrame[]): void {
    frames = incoming;
  },

  getFrames(): TelemetryFrame[] {
    return frames;
  },

  reset(): void {
    frames = [];
  },
};

