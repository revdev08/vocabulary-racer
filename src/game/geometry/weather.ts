import { positiveModulo } from '../motion/simulation';
import { project, type Camera } from './perspective';

export const SNOW_FLAKES = 130;
const DEPTH_RANGE = 13;
const FALL_SPEED = 0.75;

export type Flake = { x: number; y: number; r: number; near: boolean };

/** Snowflakes live in world space: they fall and also stream toward the camera with the
 * distance driven, so their speed follows the car (slow during questions, fast in traffic). */
export function snowflakes(camera: Camera, width: number, height: number, elapsed: number, distance: number): Flake[] {
  'worklet';
  const flakes: Flake[] = [];
  for (let i = 0; i < SNOW_FLAKES; i++) {
    // Fixed per-flake seeds; no random state per frame.
    const a = positiveModulo(Math.sin(i * 12.9898) * 43758.5453, 1);
    const b = positiveModulo(Math.sin(i * 78.233) * 12345.678, 1);
    const c = positiveModulo(Math.sin(i * 39.425) * 24634.6345, 1);
    // Squared spacing puts more flakes near the camera, where they are large enough to read.
    const cycle = positiveModulo(c - distance / DEPTH_RANGE, 1);
    const depth = 0.55 + cycle * cycle * DEPTH_RANGE;
    // Spread grows with depth so flakes fill the view at every distance; a gentle sideways sway.
    const lateral = (a * 2 - 1) * (0.3 + 1.3 * depth) + Math.sin(elapsed * 0.9 + i) * 0.12;
    // Fall from the top of the screen at this depth to the ground, so every depth fills the view.
    const top = (camera.groundHeight + camera.horizonY * depth) / camera.nearLaneWidth;
    const elevation = top - positiveModulo(b * top + elapsed * FALL_SPEED, top);
    const p = project(camera, lateral, depth, elevation);
    if (p.x < -6 || p.x > width + 6 || p.y < -6 || p.y > height + 6) continue;
    flakes.push({ x: p.x, y: p.y, r: Math.min(5, Math.max(0.9, 4.2 / depth)), near: depth < 3 });
  }
  return flakes;
}
