import { telemetry as rawTelemetry } from "../../solutions/hard/hard.question";
import type { TelemetryFrame } from "../../solutions/hard/types/telemetry";

// The challenge file defines its own TelemetryFrame interface; the runtime shape matches `types.ts`.
export const telemetry: TelemetryFrame[] = rawTelemetry as unknown as TelemetryFrame[];

