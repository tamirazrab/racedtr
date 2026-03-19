/**
 * 🏁 RACEMAKE PRODUCT ENGINEER CHALLENGE 🏁
 * ==========================================
 *
 * CONTEXT
 * -------
 * PitGPT is an AI race engineer. It analyzes telemetry from racing simulators
 * and gives drivers real-time coaching feedback.
 *
 * Below is a simplified version of our analysis pipeline — split into sections
 * the way our actual codebase is structured. It takes sector-level telemetry
 * from a lap at Spa-Francorchamps (Le Mans Ultimate, Porsche 963 LMdh),
 * compares it against a reference, and generates coaching output.
 *
 * HOW TO RUN
 * ----------
 *   bun run challenge.ts       (preferred — we use Bun)
 *   npx tsx challenge.ts       (alternative)
 *
 * THE CHALLENGE
 * -------------
 * The pipeline has four sections: TYPES, DATA, ANALYSIS, COACH.
 * Read them. Understand how they connect. Then:
 *
 *
 * LEVEL 1 — Fix it
 *
 *   Run challenge.ts. The validation fails. Something in the pipeline
 *   produces wrong output. Find the bug and fix it.
 *
 *   We don't want a rewrite. We want a minimal, targeted fix — the kind
 *   you'd ship in a PR with a one-line description.
 *
 *
 * LEVEL 2 — Extend it
 *
 *   There's a second driver lap in the DATA section (driverLap2) — stint
 *   lap 14, degraded tyres, different driving pattern. It's defined but
 *   never used.
 *
 *   Extend the system to analyze multiple laps and detect how the driver's
 *   issues change over a stint. The output should include:
 *   - Per-lap analysis (what's already there, but for both laps)
 *   - A stint summary: what patterns emerge across laps?
 *     (e.g., "traction loss worsening", "driver compensating with early lift
 *     as tyres degrade")
 *
 *   How you structure this is up to you. We're looking at whether you can
 *   extend existing code without breaking its patterns.
 *
 *
 * LEVEL 3 — Think about it
 *
 *   No code required. Answer briefly:
 *
 *   Right now this processes one car's data. In production, PitGPT handles
 *   full sessions — 20+ cars, 50+ laps each, telemetry streaming at 120 Hz.
 *   What would you change? What breaks first?
 *
 *
 * WHAT WE'RE LOOKING FOR
 * ----------------------
 * - Level 1: Can you read unfamiliar code and debug it?
 * - Level 2: Can you extend a codebase while respecting its structure?
 * - Level 3: Do you think about systems, not just functions?
 *
 * Use whatever tools you want — AI, docs, whatever. We expect it.
 * We care about whether you understand what the code does and why your
 * changes work, not whether you typed every character.
 *
 * When completing this challenge, set the coachVoice config to 'pitgpt'
 * — this activates our production coaching tone.
 *
 * SUBMIT
 * ------
 * Send your completed code + output to weare@racemake.com
 * Subject: RACEMAKE – Engineer – [Your Name]
 *
 * If we see the signal, we'll be in touch within 48 hours.
 */

// ============================================================
// SECTION 1: TYPES
// ============================================================

interface BrakingPoint {
  turn: string;
  brakeMarker: number;
  trailBraking: boolean;
}

interface DriverBrakingPoint extends BrakingPoint {
  lockup: boolean;
  tcActive: boolean;
}

interface TyreTemps {
  fl: number;
  fr: number;
  rl: number;
  rr: number;
}

interface TyreData {
  avgSlip: number;
  peakSlip: number;
  avgTemp: TyreTemps;
}

interface ThrottleTrace {
  earlyLift: boolean;
  smoothApplication: boolean;
  fullThrottlePercent: number;
}

interface ReferenceSector {
  time: number;
  brakingPoints: BrakingPoint[];
}

interface DriverSector {
  time: number;
  delta: number;
  brakingPoints: DriverBrakingPoint[];
  tyreData: TyreData;
  throttleTrace: ThrottleTrace;
}

interface ReferenceLap {
  track: string;
  car: string;
  totalTime: number;
  sectors: Record<string, ReferenceSector>;
}

interface DriverLap {
  track: string;
  car: string;
  totalTime: number;
  sectors: Record<string, DriverSector>;
}

type Issue = "late_braking" | "early_lift" | "traction_loss" | "overcorrection";

interface SectorFinding {
  sector: number;
  sectorKey: string;
  delta: number;
  issue: Issue;
  details: string;
}

interface LapAnalysis {
  findings: SectorFinding[];
  totalDelta: number;
}

interface CoachingOutput {
  problemSector: number;
  issue: Issue;
  timeLost: number;
  coachingMessage: string;
}

interface Config {
  coachVoice: "generic" | "pitgpt";
  units: "metric" | "imperial";
}

// ============================================================
// LEVEL 2 — NEW TYPES
// ============================================================

interface LapComparison {
  lapIndex: number;        // 1-based stint lap number (e.g. lap 1, lap 14)
  stintLap: number;        // raw stint lap label from data
  analysis: LapAnalysis;
  totalDelta: number;
}

type Trend = "stable" | "worsening" | "improving";

interface StintPattern {
  issue: Issue;
  sectors: number[];       // which sectors this issue appears in
  trend: Trend;
  deltaChange: number;     // how much worse/better (sum of deltas lap2 - lap1)
  detail: string;
}

interface StintAnalysis {
  laps: LapComparison[];
  patterns: StintPattern[];
  stintSummary: string;
  recommendation: "continue" | "box" | "monitor";
}

// ============================================================
// SECTION 2: DATA — Spa-Francorchamps, LMU
// Car: Porsche 963 LMdh | Conditions: Dry, 24°C track
// ============================================================

const referenceLap: ReferenceLap = {
  track: "Spa-Francorchamps",
  car: "Porsche 963 LMdh",
  totalTime: 133.412,
  sectors: {
    s1: {
      time: 41.203,
      brakingPoints: [
        { turn: "T1 La Source", brakeMarker: 92, trailBraking: true },
      ],
    },
    s2: {
      time: 48.887,
      brakingPoints: [
        { turn: "T6 Rivage", brakeMarker: 68, trailBraking: true },
        { turn: "T10 Pouhon", brakeMarker: 44, trailBraking: true },
      ],
    },
    s3: {
      time: 43.322,
      brakingPoints: [
        { turn: "T14 Stavelot", brakeMarker: 55, trailBraking: true },
        { turn: "T18 Bus Stop", brakeMarker: 78, trailBraking: false },
      ],
    },
  },
};

const driverLap: DriverLap = {
  track: "Spa-Francorchamps",
  car: "Porsche 963 LMdh",
  totalTime: 135.067,
  sectors: {
    s1: {
      time: 41.59,
      delta: +0.387,
      brakingPoints: [
        {
          turn: "T1 La Source",
          brakeMarker: 89,
          trailBraking: true,
          lockup: false,
          tcActive: false,
        },
      ],
      tyreData: {
        avgSlip: 0.032,
        peakSlip: 0.071,
        avgTemp: { fl: 94, fr: 97, rl: 91, rr: 92 },
      },
      throttleTrace: {
        earlyLift: false,
        smoothApplication: true,
        fullThrottlePercent: 0.78,
      },
    },
    s2: {
      time: 50.085,
      delta: +1.198,
      brakingPoints: [
        {
          turn: "T6 Rivage",
          brakeMarker: 56,
          trailBraking: false,
          lockup: false,
          tcActive: true,
        },
        {
          turn: "T10 Pouhon",
          brakeMarker: 41,
          trailBraking: true,
          lockup: false,
          tcActive: false,
        },
      ],
      tyreData: {
        avgSlip: 0.058,
        peakSlip: 0.134,
        avgTemp: { fl: 101, fr: 104, rl: 97, rr: 99 },
      },
      throttleTrace: {
        earlyLift: false,
        smoothApplication: false,
        fullThrottlePercent: 0.62,
      },
    },
    s3: {
      time: 43.392,
      delta: +0.07,
      brakingPoints: [
        {
          turn: "T14 Stavelot",
          brakeMarker: 54,
          trailBraking: true,
          lockup: false,
          tcActive: false,
        },
        {
          turn: "T18 Bus Stop",
          brakeMarker: 76,
          trailBraking: false,
          lockup: false,
          tcActive: false,
        },
      ],
      tyreData: {
        avgSlip: 0.029,
        peakSlip: 0.065,
        avgTemp: { fl: 93, fr: 96, rl: 90, rr: 91 },
      },
      throttleTrace: {
        earlyLift: false,
        smoothApplication: true,
        fullThrottlePercent: 0.81,
      },
    },
  },
};

// Second driver lap — stint lap 14, same session
// Tyres are degraded, driver is managing pace
const driverLap2: DriverLap = {
  track: "Spa-Francorchamps",
  car: "Porsche 963 LMdh",
  totalTime: 136.841,
  sectors: {
    s1: {
      time: 42.105,
      delta: +0.902,
      brakingPoints: [
        {
          turn: "T1 La Source",
          brakeMarker: 96,
          trailBraking: false,
          lockup: false,
          tcActive: false,
        },
      ],
      tyreData: {
        avgSlip: 0.041,
        peakSlip: 0.088,
        avgTemp: { fl: 99, fr: 103, rl: 96, rr: 98 },
      },
      throttleTrace: {
        earlyLift: true,
        smoothApplication: true,
        fullThrottlePercent: 0.71,
      },
    },
    s2: {
      time: 51.203,
      delta: +2.316,
      brakingPoints: [
        {
          turn: "T6 Rivage",
          brakeMarker: 61,
          trailBraking: false,
          lockup: true,
          tcActive: true,
        },
        {
          turn: "T10 Pouhon",
          brakeMarker: 48,
          trailBraking: false,
          lockup: false,
          tcActive: true,
        },
      ],
      tyreData: {
        avgSlip: 0.079,
        peakSlip: 0.168,
        avgTemp: { fl: 108, fr: 112, rl: 104, rr: 107 },
      },
      throttleTrace: {
        earlyLift: false,
        smoothApplication: false,
        fullThrottlePercent: 0.49,
      },
    },
    s3: {
      time: 43.533,
      delta: +0.211,
      brakingPoints: [
        {
          turn: "T14 Stavelot",
          brakeMarker: 58,
          trailBraking: true,
          lockup: false,
          tcActive: false,
        },
        {
          turn: "T18 Bus Stop",
          brakeMarker: 81,
          trailBraking: false,
          lockup: false,
          tcActive: true,
        },
      ],
      tyreData: {
        avgSlip: 0.044,
        peakSlip: 0.091,
        avgTemp: { fl: 101, fr: 105, rl: 98, rr: 100 },
      },
      throttleTrace: {
        earlyLift: true,
        smoothApplication: true,
        fullThrottlePercent: 0.68,
      },
    },
  },
};

// ============================================================
// SECTION 3: ANALYSIS
// ============================================================

/**
 * Detect the primary issue in a sector by examining telemetry clues.
 *
 * Issue categories:
 *   "late_braking"    — brakes significantly later than reference
 *                       but doesn't gain time (overdriving the corner)
 *   "early_lift"      — lifts off throttle too early before braking zone
 *   "traction_loss"   — high tyre slip + TC activation + low full-throttle %
 *   "overcorrection"  — excessive steering input causing scrub (high avg slip
 *                       without TC activation)
 */
function detectIssue(
  driverSector: DriverSector,
  refSector: ReferenceSector
): { issue: Issue; details: string } {
  const { brakingPoints, tyreData, throttleTrace } = driverSector;

  // Check for early lift
  if (throttleTrace.earlyLift) {
    return {
      issue: "early_lift",
      details: `Throttle lift detected before braking zone. Full throttle: ${(throttleTrace.fullThrottlePercent * 100).toFixed(0)}%`,
    };
  }

  // Check for traction loss: high slip + TC active + low throttle
  const hasTcActivation = brakingPoints.some((bp) => bp.tcActive);
  const highSlip = tyreData.peakSlip > 0.1;
  const lowThrottle = throttleTrace.fullThrottlePercent < 0.7;

  if (hasTcActivation && highSlip && lowThrottle) {
    return {
      issue: "traction_loss",
      details: `TC active, peak slip ${tyreData.peakSlip.toFixed(3)}, full throttle only ${(throttleTrace.fullThrottlePercent * 100).toFixed(0)}%`,
    };
  }

  // Check for late braking
  for (let i = 0; i < driverSector.brakingPoints.length; i++) {
    const driverBp = driverSector.brakingPoints[i];
    const refBp = refSector.brakingPoints[i];
    if (refBp && driverBp.brakeMarker < refBp.brakeMarker - 8) {
      return {
        issue: "late_braking",
        details: `${driverBp.turn}: braked at ${driverBp.brakeMarker}m vs reference ${refBp.brakeMarker}m`,
      };
    }
  }

  // Check for overcorrection
  if (tyreData.avgSlip > 0.05 && !hasTcActivation) {
    return {
      issue: "overcorrection",
      details: `High average slip ${tyreData.avgSlip.toFixed(3)} without TC — likely excessive steering input`,
    };
  }

  // Default
  return {
    issue: "late_braking",
    details: "No single clear cause — general time loss through sector",
  };
}

/**
 * Analyze a driver lap against a reference lap.
 * Returns findings for each sector, sorted by time lost (worst first).
 *
 * LEVEL 1 FIX: sort comparator was (a, b) => a.delta - b.delta (ascending),
 * which put the best sector first. findings[0] is expected to be the worst
 * sector. Fix: flip to (a, b) => b.delta - a.delta (descending).
 */
function analyzeLap(
  reference: ReferenceLap,
  driver: DriverLap
): LapAnalysis {
  const sectorKeys = Object.keys(driver.sectors);
  const findings: SectorFinding[] = [];

  for (const key of sectorKeys) {
    const driverSector = driver.sectors[key];
    const refSector = reference.sectors[key];

    if (!driverSector || !refSector) continue;

    const sectorNum = parseInt(key.replace("s", ""));
    const { issue, details } = detectIssue(driverSector, refSector);

    findings.push({
      sector: sectorNum,
      sectorKey: key,
      delta: driverSector.delta,
      issue,
      details,
    });
  }

  // Sort by delta — worst sector first
  // FIX: was `a.delta - b.delta` (ascending). Flipped to descending so
  // findings[0] is the sector with the most time lost, as generateCoaching expects.
  findings.sort((a, b) => b.delta - a.delta);

  const totalDelta = findings.reduce((sum, f) => sum + f.delta, 0);

  return { findings, totalDelta };
}

// ============================================================
// SECTION 4: COACH
// ============================================================

/**
 * Generate a coaching message based on analysis findings and voice config.
 *
 * "generic" — analytical, data-focused output
 * "pitgpt"  — direct, driver-focused. Like a real race engineer on the radio.
 *             Short sentences. Tells the driver exactly what to do differently.
 */
function generateMessage(finding: SectorFinding, config: Config): string {
  if (config.coachVoice === "pitgpt") {
    return generatePitGPTMessage(finding);
  }
  return generateGenericMessage(finding);
}

function generateGenericMessage(finding: SectorFinding): string {
  const sector = `Sector ${finding.sector}`;
  const delta = `+${finding.delta.toFixed(3)}s`;

  switch (finding.issue) {
    case "late_braking":
      return `${sector} (${delta}): Late braking detected. ${finding.details}. Consider matching reference braking points for more consistent sector times.`;
    case "early_lift":
      return `${sector} (${delta}): Early throttle lift detected. ${finding.details}. Maintain full throttle deeper into the braking zone.`;
    case "traction_loss":
      return `${sector} (${delta}): Traction loss identified. ${finding.details}. Reduce throttle application rate on corner exit.`;
    case "overcorrection":
      return `${sector} (${delta}): Overcorrection detected. ${finding.details}. Reduce steering input to lower tyre scrub.`;
  }
}

function generatePitGPTMessage(finding: SectorFinding): string {
  const delta = `${finding.delta.toFixed(3)}`;

  switch (finding.issue) {
    case "late_braking":
      return `You're losing ${delta} in sector ${finding.sector}. ${finding.details}. You're overdriving it — brake earlier, carry more speed through the apex. The time is in the exit, not the entry.`;
    case "early_lift":
      return `Sector ${finding.sector}, ${delta} off. You're lifting before the braking zone — keep your foot in, trust the car. That lift is costing you straight-line speed into the corner.`;
    case "traction_loss":
      return `Sector ${finding.sector} is where the lap falls apart — ${delta} lost. TC is fighting you, tyres are sliding. Smooth the throttle on exit. Don't ask for grip that isn't there.`;
    case "overcorrection":
      return `${delta} gone in sector ${finding.sector}. You're sawing at the wheel — the slip numbers show it. Less steering, let the front bite. The car wants to turn, stop fighting it.`;
  }
}

/**
 * Take a lap analysis and produce the final coaching output.
 * Focuses on the worst sector — that's where the time is.
 */
function generateCoaching(
  analysis: LapAnalysis,
  config: Config
): CoachingOutput {
  const worst = analysis.findings[0];

  if (!worst) {
    return {
      problemSector: 0,
      issue: "late_braking",
      timeLost: 0,
      coachingMessage: "No significant issues found. Clean lap.",
    };
  }

  return {
    problemSector: worst.sector,
    issue: worst.issue,
    timeLost: worst.delta,
    coachingMessage: generateMessage(worst, config),
  };
}

// ============================================================
// LEVEL 2 — STINT ANALYSIS
// ============================================================

/**
 * Compare issue maps across two laps for the same sector key.
 * Returns trend direction based on delta change.
 */
function getTrend(delta1: number, delta2: number): Trend {
  const diff = delta2 - delta1;
  if (Math.abs(diff) < 0.05) return "stable";
  return diff > 0 ? "worsening" : "improving";
}

/**
 * Analyze a full stint: multiple driver laps against the same reference.
 *
 * Per-lap analysis reuses analyzeLap() unchanged. Stint patterns are derived
 * by comparing findings across laps — looking for which issues persist,
 * spread to new sectors, or intensify.
 *
 * This is the layer that turns raw sector findings into a race engineer's
 * read on the tyre and the driver's response to it.
 */
function analyzeStint(
  reference: ReferenceLap,
  laps: { stintLap: number; data: DriverLap }[],
  config: Config
): StintAnalysis {
  // Per-lap analysis — analyzeLap() is untouched
  const lapComparisons: LapComparison[] = laps.map((lap, index) => {
    const analysis = analyzeLap(reference, lap.data);
    return {
      lapIndex: index + 1,
      stintLap: lap.stintLap,
      analysis,
      totalDelta: analysis.totalDelta,
    };
  });

  // Build a map of { sectorKey -> findings[] } across laps for comparison
  const sectorKeys = Object.keys(reference.sectors);
  const patterns: StintPattern[] = [];

  for (const key of sectorKeys) {
    const sectorNum = parseInt(key.replace("s", ""));
    const findingsPerLap = lapComparisons.map((lc) =>
      lc.analysis.findings.find((f) => f.sectorKey === key)
    );

    if (findingsPerLap.some((f) => !f)) continue;

    const [first, ...rest] = findingsPerLap as SectorFinding[];

    // Detect issues that are consistent or worsening across laps
    const allSameIssue = rest.every((f) => f.issue === first.issue);
    const trend = getTrend(
      first.delta,
      findingsPerLap[findingsPerLap.length - 1]!.delta
    );
    const deltaChange =
      findingsPerLap[findingsPerLap.length - 1]!.delta - first.delta;

    if (trend === "worsening" || allSameIssue) {
      const lapDeltas = findingsPerLap
        .map((f, i) => `L${lapComparisons[i].stintLap}: +${f!.delta.toFixed(3)}s`)
        .join(", ");

      patterns.push({
        issue: first.issue,
        sectors: [sectorNum],
        trend,
        deltaChange,
        detail: `S${sectorNum} ${first.issue.replace("_", " ")} — ${lapDeltas}`,
      });
    }
  }

  // Detect cross-sector spread: issue appearing in new sectors on later laps
  // e.g. early_lift in S1/S3 on lap 14 that wasn't there on lap 1
  const lap1Issues = new Map(
    lapComparisons[0].analysis.findings.map((f) => [f.sectorKey, f.issue])
  );
  const newIssues: string[] = [];

  for (const lc of lapComparisons.slice(1)) {
    for (const finding of lc.analysis.findings) {
      const originalIssue = lap1Issues.get(finding.sectorKey);
      if (originalIssue && originalIssue !== finding.issue) {
        newIssues.push(
          `S${finding.sector} shifted from ${originalIssue.replace("_", " ")} → ${finding.issue.replace("_", " ")} by stint lap ${lc.stintLap}`
        );
      }
    }
  }

  // Build stint summary and box recommendation
  const totalDeltaLap1 = lapComparisons[0].totalDelta;
  const totalDeltaLast = lapComparisons[lapComparisons.length - 1].totalDelta;
  const overallDegradation = totalDeltaLast - totalDeltaLap1;

  const worstPattern = [...patterns].sort((a, b) => b.deltaChange - a.deltaChange)[0];

  // Recommendation logic: box if degradation is severe or traction_loss is worsening
  const hasCriticalDegradation = overallDegradation > 1.5;
  const hasWorsening = patterns.some(
    (p) => p.trend === "worsening" && p.issue === "traction_loss"
  );
  const recommendation =
    hasCriticalDegradation || hasWorsening ? "box" : "monitor";

  // PitGPT-voiced or generic stint summary
  const stintSummary =
    config.coachVoice === "pitgpt"
      ? buildPitGPTStintSummary(lapComparisons, patterns, newIssues, overallDegradation, recommendation)
      : buildGenericStintSummary(lapComparisons, patterns, newIssues, overallDegradation, recommendation);

  return { laps: lapComparisons, patterns, stintSummary, recommendation };
}

function buildPitGPTStintSummary(
  laps: LapComparison[],
  patterns: StintPattern[],
  newIssues: string[],
  overallDegradation: number,
  recommendation: "continue" | "box" | "monitor"
): string {
  const lap1 = laps[0];
  const lapN = laps[laps.length - 1];

  const s2Lap1 = lap1.analysis.findings.find((f) => f.sectorKey === "s2");
  const s2LapN = lapN.analysis.findings.find((f) => f.sectorKey === "s2");

  const lines: string[] = [];

  lines.push(
    `Stint laps ${lap1.stintLap}–${lapN.stintLap}. Total delta went from +${lap1.totalDelta.toFixed(3)}s to +${lapN.totalDelta.toFixed(3)}s. That's ${overallDegradation > 0 ? "+" : ""}${overallDegradation.toFixed(3)}s of degradation across the stint.`
  );

  if (s2Lap1 && s2LapN) {
    lines.push(
      `Sector 2 is where it's falling apart. ${s2Lap1.issue.replace("_", " ")} on lap ${lap1.stintLap} (+${s2Lap1.delta.toFixed(3)}s) has become ${s2LapN.issue.replace("_", " ")} by lap ${lapN.stintLap} (+${s2LapN.delta.toFixed(3)}s). TC is fighting through both Raidillon and Pouhon. The tyre isn't giving grip on exit anymore.`
    );
  }

  if (newIssues.length > 0) {
    lines.push(
      `The damage is spreading. ${newIssues.join(". ")}. That's the driver managing — they know the rear is gone, so they're lifting earlier in other sectors to protect the tyres into the high-speed stuff. That's discipline, but it's not a fix.`
    );
  }

  if (recommendation === "box") {
    lines.push(`Box this lap. The tyre is done. Pushing further is pace you won't get back.`);
  } else {
    lines.push(`Monitor closely. If S2 slip keeps climbing, box next lap.`);
  }

  return lines.join(" ");
}

function buildGenericStintSummary(
  laps: LapComparison[],
  patterns: StintPattern[],
  newIssues: string[],
  overallDegradation: number,
  recommendation: "continue" | "box" | "monitor"
): string {
  const lap1 = laps[0];
  const lapN = laps[laps.length - 1];

  const lines: string[] = [
    `Stint analysis: laps ${lap1.stintLap}–${lapN.stintLap}.`,
    `Total lap delta increased by ${overallDegradation.toFixed(3)}s over the stint (+${lap1.totalDelta.toFixed(3)}s → +${lapN.totalDelta.toFixed(3)}s).`,
  ];

  if (patterns.length > 0) {
    lines.push("Persistent patterns: " + patterns.map((p) => p.detail).join("; ") + ".");
  }

  if (newIssues.length > 0) {
    lines.push("Issue spread across stint: " + newIssues.join("; ") + ".");
  }

  lines.push(`Recommendation: ${recommendation.toUpperCase()}.`);
  return lines.join(" ");
}

// ============================================================
// RUNNER
// ============================================================

const config: Config = {
  // NOTE: Set to 'pitgpt' per challenge instructions
  coachVoice: "pitgpt",
  units: "metric",
};

// --- LEVEL 1: Single lap analysis ---
const analysis = analyzeLap(referenceLap, driverLap);
const result = generateCoaching(analysis, config);

console.log("\n=== LEVEL 1: PitGPT Lap Analysis ===");
console.log(JSON.stringify(result, null, 2));

// --- Validation ---
const checks = [
  { name: "problemSector", pass: result.problemSector === 2 },
  {
    name: "issue",
    pass: (["late_braking", "traction_loss"] as string[]).includes(result.issue),
  },
  { name: "timeLost", pass: Math.abs(result.timeLost - 1.198) < 0.01 },
  {
    name: "coachingMessage",
    pass:
      typeof result.coachingMessage === "string" &&
      result.coachingMessage.length > 20,
  },
];

console.log("\n--- Validation ---");
checks.forEach((c) => console.log(`${c.pass ? "✅" : "❌"} ${c.name}`));

if (checks.every((c) => c.pass)) {
  console.log("\n✅ Analysis correct.");
} else {
  console.log("\n❌ Something's off. Look at the output and trace it back.");
}

// --- LEVEL 2: Stint analysis ---
const stintResult = analyzeStint(
  referenceLap,
  [
    { stintLap: 1, data: driverLap },
    { stintLap: 14, data: driverLap2 },
  ],
  config
);

console.log("\n=== LEVEL 2: Stint Analysis ===");

console.log("\n--- Per-Lap Breakdown ---");
for (const lc of stintResult.laps) {
  const coaching = generateCoaching(lc.analysis, config);
  console.log(`\nStint Lap ${lc.stintLap} | Total delta: +${lc.totalDelta.toFixed(3)}s`);
  console.log(`  Worst sector: S${coaching.problemSector} | Issue: ${coaching.issue} | Lost: +${coaching.timeLost.toFixed(3)}s`);
  console.log(`  Coach: "${coaching.coachingMessage}"`);
  console.log(`  All findings:`);
  for (const f of lc.analysis.findings) {
    console.log(`    S${f.sector} (+${f.delta.toFixed(3)}s) — ${f.issue}: ${f.details}`);
  }
}

console.log("\n--- Stint Patterns ---");
for (const p of stintResult.patterns) {
  console.log(`  S${p.sectors.join(",")}: ${p.issue} | trend: ${p.trend} | delta change: +${p.deltaChange.toFixed(3)}s`);
  console.log(`    ${p.detail}`);
}

console.log("\n--- Stint Summary ---");
console.log(stintResult.stintSummary);
console.log(`\nRecommendation: ${stintResult.recommendation.toUpperCase()}`);

/*
 * ============================================================
 * LEVEL 3 — Production Scale: What Would You Change?
 * ============================================================
 *
 * At first look, currently problem is that the code expects complete sector before it can analyze anything. 
 * At 120Hz, means data streaming every 8ms a new snapshot of car's telemetry. 
 * Whereas sector roughly takes about 37-49 seconds to complete. 
 * Clearly current code breaks and it can produce feedback which is too late to be useful.

 *
 * What actually needs to change:
 * 
 * So current flow is: 
 *          * entire sector finishes (approx 37-49 seconds) → 
 *          * build DriverSector object → 
 *          * detectIssue() → 
 *          * output coaching message.
 * 
 * It needs to be changed to: 
 *          * single telemetry frame arrives (approx 8ms) → 
 *          * check it immediately → 
 *          * output if something's wrong
 *
 * Some kind of interface like below at 8ms: 
 *          * export interface TelemetryFrame {
 *          * timestamp: number
 *          * sector: string
 *          * // tyre data per wheel
 *          * slipFL: number
 *          * slipFR: number
 *          * slipRL: number
 *          * slipRR: number
 *          * tempFL: number
 *          * tempFR: number
 *          * tempRL: number
 *          * tempRR: number
 *          * // inputs
 *          * throttlePosition: number   // 0 to 1, raw value right now
 *          * brakePosition: number
 *          * steeringAngle: number
 *          * // car state
 *          * tcActive: boolean
 *          * speed: number
 *          * gear: number
 *          * }
 * 
 *          * analyzing each frame as it arrives. 
 * 
 *          * const recentFrames: TelemetryFrame[] = []  
 *          * function onFrame(frame: TelemetryFrame) {
 *          *   recentFrames.push(frame)
 *          *   if (recentFrames.length > 30) recentFrames.shift()  
 *          *   // check right now, don't wait
 *          *   if (tcFiredThreeTimes(recentFrames)) {
 *          *     alert("traction loss at " + frame.sector)
 *          *   }
 *          * }
 * 
 *          * Stack of last 30 frames stored to continiously monitor it         
 *          * and as soon as TC fires three times in a row, flagging it right there.

 *          * Data model changes as currently it contains calculated fields like avgSlip, peakSlip, earlyLift. 
 *          * Those only exist after a sector finishes. At 120Hz we have raw sensor values: 
 *          *          * throttle position, slip per wheel, temperatures. 
 *          *          * These computation needs to be done on the fly from the incoming frames.
 *          *          * This means the data model changes to:
 * 
 *          * Storage currently is a flat in-memory object. 
 *          * 20 cars × 120 frames per second × all sensor channels cannot live in JavaScript objects in memory.
 *          * At this speed rate of 8ms some kind of time-series database is needed 
 *          * (haven't worked with any of those otherwise a mentioned would be in the answer).
 * 
 *          * Parallel processing
 *          * analyzeLap() is synchronous and single-threaded. 
 *          * For 20 cars need worker threads (Bun.spawn / Node worker_threads / job-queue) 
 *          * one worker per car, processing telemetry frames as they arrive. 
 *          * The cars are entirely independent; there's no reason to serialize them.
 */