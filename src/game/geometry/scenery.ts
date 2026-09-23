import { scenery } from '../config/scenery';
import { positiveModulo } from '../motion/simulation';
import { clamp, projectWorld, type Camera } from './perspective';

export function sceneryOpacity(distance: number) {
  'worklet';
  const t = clamp((distance - scenery.solidUntil) / (scenery.fadeEnd - scenery.solidUntil), 0, 1);
  return 1 - t * t * (3 - 2 * t);
}

/** Pool slots exchange identical trees at the far edge; nothing respawns nearby. */
export function treeDepth(index: number, travelled: number, side: -1 | 1) {
  'worklet';
  const { near, spacing, rightOffset } = scenery.trees;
  return near + index * spacing - positiveModulo(travelled + (side === 1 ? rightOffset : 0), spacing);
}

export function treePlacement(camera: Camera, distance: number, side: -1 | 1, aspect: number) {
  'worklet';
  if (distance < scenery.trees.near) return { x: 0, y: 0, width: 0, height: 0, opacity: 0 };
  const foot = projectWorld(camera, { lateral: side * scenery.trees.lateral, distance });
  const top = projectWorld(camera, { lateral: side * scenery.trees.lateral, distance, elevation: scenery.trees.height });
  const height = foot.y - top.y;
  const width = height * aspect;
  return { x: foot.x - width / 2, y: top.y, width, height, opacity: sceneryOpacity(distance) };
}
