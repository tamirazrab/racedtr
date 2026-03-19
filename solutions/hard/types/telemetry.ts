export interface TelemetryFrame {
  ts: number;
  lap: number;
  pos: number;
  spd: number;
  thr: number;
  brk: number;
  str: number;
  gear: number;
  rpm: number;
  tyres: { fl: number; fr: number; rl: number; rr: number };
}

export interface SectorSummary {
  sector: number;
  time: number;
}

export interface LapSummary {
  lapNumber: number;
  lapTime: number;
  sectors: SectorSummary[];
  avgSpeed: number;
  maxSpeed: number;
}

export interface AnalysisResult {
  bestLap: { lapNumber: number; lapTime: number };
  worstLap: { lapNumber: number; lapTime: number; delta: number };
  problemSector: number;
  issue: string;
  coachingMessage: string;
}

