import { scenery } from '../config/scenery';
import type { RoadsideConfig } from '../config/maps';
import { positiveModulo } from '../motion/simulation';
import { clamp, projectWorld, type Camera } from './perspective';

export function sceneryOpacity(distance: number, solidUntil: number = scenery.solidUntil, fadeEnd: number = scenery.fadeEnd) {
  'worklet';
  const t = clamp((distance - solidUntil) / (fadeEnd - solidUntil), 0, 1);
  return 1 - t * t * (3 - 2 * t);
}

/** Pool slots exchange identical trees at the far edge; nothing respawns nearby. */
export function treeDepth(index: number, travelled: number, side: -1 | 1, config = scenery.trees as Pick<RoadsideConfig, 'near' | 'spacing' | 'rightOffset'>) {
  'worklet';
  const { near, spacing, rightOffset } = config;
  return near + index * spacing - positiveModulo(travelled + (side === 1 ? rightOffset : 0), spacing);
}

export function treePlacement(camera: Camera, distance: number, side: -1 | 1, aspect: number,
  config = { ...scenery.trees, anchorY: 1, left: true, right: true } as RoadsideConfig,
  solidUntil: number = scenery.solidUntil, fadeEnd: number = scenery.fadeEnd) {
  'worklet';
  if (distance < config.near || !(side < 0 ? config.left : config.right)) return { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
  const foot = projectWorld(camera, { lateral: side * config.lateral, distance });
  const top = projectWorld(camera, { lateral: side * config.lateral, distance, elevation: config.height });
  const height = foot.y - top.y;
  const width = height * aspect;
  return { x: foot.x - width / 2, y: top.y + height * (1 - config.anchorY), width, height, opacity: sceneryOpacity(distance, solidUntil, fadeEnd) };
}
