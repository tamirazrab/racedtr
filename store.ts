import type { TelemetryFrame } from "./types";

let frames: TelemetryFrame[] = [];

export const store = {
  ingest(incoming: TelemetryFrame[]): void {
    frames = incoming;
  },

  getFrames(): TelemetryFrame[] {
    return frames;
  },
};