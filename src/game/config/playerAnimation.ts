export const playerAnimation = {
  // Lateral speed in lane widths/second. Small settling corrections stay straight.
  neutralSpeed: 0.25,
  fullTurnSpeed: 1.2,
  enterSeconds: 0.024,
  returnSeconds: 0.045,
  reverseSeconds: 0.018,
  snapWeight: 0.003,
  // Registration in the unchanged 1254px PNGs: silhouette center and tire baseline.
  frames: {
    straight: { centerX: 627, baseY: 1032 },
    left: { centerX: 653, baseY: 1037 },
    right: { centerX: 614, baseY: 1041 },
  },
} as const;
