/** Distances and sizes use the same lane-width units as the road. */
export const scenery = {
  curb: 1.54,
  wall: 2.75,
  facadeLength: 6,
  facadeHeight: 18,
  texturePeriod: 12,
  solidUntil: 8,
  fadeEnd: 22,
  trees: {
    lateral: 2.12,
    height: 1.35,
    spacing: 1.2,
    countPerSide: 26,
    near: 0.3,
    rightOffset: 0.6,
  },
} as const;
