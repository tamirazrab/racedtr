export const config = {
  port: Number(
    ((globalThis as any).Bun?.env?.PORT ??
      (globalThis as any).process?.env?.PORT ??
      3000)
  ),

  sectorBoundaries: {
    s1ToS2: 0.333,
    s2ToS3: 0.667,
  },

  stationaryFilter: {
    minSpeedKmh: 5,
    minPosDelta: 0.001,
  },

  issueDetection: {
    tyreOverheatC: 110,
    heavyBraking: { brakeMin: 0.8, speedMinKmh: 200 },
    lowThrottleAvg: 0.6,
    inconsistencySpeedStddevKmh: 40,
  },
} as const;
