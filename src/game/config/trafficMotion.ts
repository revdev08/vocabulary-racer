/** World speeds and seconds. Maneuvers finish before the player's reaction window. */
export const trafficMotion = {
  speeds: [0.32, 0.44, 0.56],
  signalSeconds: 0.65,
  changeSeconds: 0.78,
  settledBeforeContactSeconds: 0.65,
  signalCycleSeconds: 0.48,
  betweenManeuversSeconds: 0.25,
  beginnerChanges: 2,
  advancedChanges: 3,
  advancedAfterRounds: 3,
  vehicleClearance: 0.04,
} as const;
