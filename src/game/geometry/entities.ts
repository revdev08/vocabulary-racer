import { gameplay, objectVisuals } from '../config/gameplay';
import type { RunState, WorldObject, WorldCoin } from '../gameplay/types';
import { clamp, projectWorld, type SceneLayout } from './perspective';

export function objectProjection(layout: SceneLayout, object: WorldObject, travelled: number) {
  'worklet';
  const depth = layout.playerDepth + object.position - travelled;
  const safeDepth = Math.max(0.25, depth);
  const bounds = objectVisuals[object.kind];
  const foot = projectWorld(layout.camera, { lateral: object.lane, distance: safeDepth });
  const size = bounds.visibleWidth / (bounds.right - bounds.left) * layout.camera.nearLaneWidth / safeDepth;
  return { x: foot.x - size * (bounds.left + bounds.right) / 2, y: foot.y - size * bounds.bottom,
    size, depth, foot, visibleWidth: size * (bounds.right - bounds.left),
    opacity: depth > 0.3 ? (object.contacted ? 0.55 : 1) : 0 };
}

/** One shared projected row for both the Skia structure and RN labels. */
export function portalProjection(layout: SceneLayout, state: RunState, lane: number) {
  'worklet';
  const depth = Math.max(0.4, layout.playerDepth + state.portalPosition - state.distance);
  const foot = projectWorld(layout.camera, { lateral: lane, distance: depth });
  const laneWidth = layout.camera.nearLaneWidth / depth;
  const width = laneWidth * 0.88, height = laneWidth * 1.16;
  const labelHeight = clamp(width * 0.48, 30, 50);
  const active = state.phase === 'question' || state.phase === 'feedback';
  const opacity = !active ? 0 : state.phase === 'feedback'
    ? clamp(1 - state.phaseTime / gameplay.portalExitFadeSeconds, 0, 1) : 1;
  return { x: foot.x - width / 2, y: foot.y - height, width, height, labelHeight, foot, opacity };
}

export function portalTone(state: RunState, lane: number) {
  'worklet';
  if (!state.answered || !state.question) return 'neutral';
  if (lane === state.question.correctLane) return 'correct';
  return lane === state.selectedLane ? 'wrong' : 'neutral';
}

export function coinProjection(layout: SceneLayout, coin: WorldCoin, travelled: number) {
  'worklet';
  const depth = layout.playerDepth + coin.position - travelled;
  const foot = projectWorld(layout.camera, { lateral: coin.lane, distance: Math.max(0.4, depth) });
  const radius = gameplay.coinRadius * layout.camera.nearLaneWidth / Math.max(0.4, depth);
  return { x: foot.x, y: foot.y - radius * 1.35, footY: foot.y, radius, opacity: depth > 0.5 ? 1 : 0 };
}
