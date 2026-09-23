export const driving = {
  speed: 1.8,
  laneResponseSeconds: 0.065,
  laneSnapDistance: 0.001,
  maxFrameGapMs: 250,
  swipeThreshold: 24,
  swipeDominance: 1.35,
  road: {
    nearClip: 1,
    segmentLength: 0.86,
    dashLength: 0.40,
    segmentCount: 64,
    textureRepeatsPerUnit: 0.55,
  },
} as const;
