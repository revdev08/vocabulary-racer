/** Projected depth: horizon=0, bottom of the viewport=1. */
export function depthAt(t: number): number { return .12 / (1.12 - Math.max(0, Math.min(1, t))); }
export function roadHalf(width: number, p: number): number { return width * (.035 + .70 * p); }
export function laneX(width: number, lane: number, p: number): number { return width / 2 + (lane - 1) * roadHalf(width, p) * 2 / 3; }
export function groundY(height: number, p: number): number { return height * (.28 + .72 * p); }
// At t=1 the encounter meets the car's ground contact, p=.72.
export function encounterDepth(t: number): number { return 1 / (2.5 + (1 / .72 - 2.5) * Math.max(0, Math.min(1, t))); }
export const SAMPLES = Array.from({ length: 33 }, (_, i) => i / 32);

/** Shear a vertical dash along its divider, preserving its projected height. */
export function dividerSkew(width: number, height: number, lateral: number): number {
  return Math.atan(lateral * width * .70 / (height * .72)) * 180 / Math.PI;
}
