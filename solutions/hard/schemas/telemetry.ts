import { type } from "arktype";

export type ValidationError = { path: string; message: string };

export const TelemetryFrameSchema = type({
  ts: "number",
  lap: "number.integer",
  pos: "number",
  spd: "number",
  thr: "number",
  brk: "number",
  str: "number",
  gear: "number.integer",
  rpm: "number.integer",
  tyres: {
    fl: "number",
    fr: "number",
    rl: "number",
    rr: "number",
  },
} as const).narrow(
  (f) =>
    Number.isFinite(f.ts) &&
    f.ts >= 0 &&
    f.lap >= 0 &&
    Number.isFinite(f.pos) &&
    f.pos >= 0 &&
    f.pos <= 1 &&
    Number.isFinite(f.spd) &&
    f.spd >= 0 &&
    Number.isFinite(f.thr) &&
    f.thr >= 0 &&
    f.thr <= 1 &&
    Number.isFinite(f.brk) &&
    f.brk >= 0 &&
    f.brk <= 1 &&
    Number.isFinite(f.str) &&
    f.str >= -1 &&
    f.str <= 1 &&
    f.rpm >= 0 &&
    Number.isFinite(f.tyres.fl) &&
    Number.isFinite(f.tyres.fr) &&
    Number.isFinite(f.tyres.rl) &&
    Number.isFinite(f.tyres.rr)
);

export const TelemetryFramesSchema = type(TelemetryFrameSchema, "[]").narrow(
  (frames) => frames.length > 0
);

export type TelemetryFrames = typeof TelemetryFramesSchema.infer;

export function isArkErrors(v: unknown): v is InstanceType<typeof type.errors> {
  return v instanceof type.errors;
}

export function formatArkErrors(
  errors: InstanceType<typeof type.errors>
): ValidationError[] {
  return errors.map((e) => ({
    path: e.propString ? `$.${e.propString}` : "$",
    message: e.message,
  }));
}

