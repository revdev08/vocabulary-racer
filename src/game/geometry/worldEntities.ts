import type { RunState } from '../gameplay/types';
import type { SceneLayout } from './perspective';
import { coinProjection, objectProjection } from './entities';
import { trafficSignal } from '../gameplay/trafficMotion';

export function projectEntities(layout: SceneLayout, state: RunState) {
  'worklet';
  const objects = state.objects.map(object => {
    const p = objectProjection(layout, object, state.distance);
    return { id: object.id, kind: object.kind, appearance: object.appearance ?? 'yellow', position: object.position, x: p.x, y: p.y,
      size: p.size, opacity: p.opacity, front: p.depth < layout.playerDepth, signal: trafficSignal(object, state.phaseTime), magnet: false };
  });
  const coins = state.coins.map(coin => {
    const p = coinProjection(layout, coin, state.distance);
    return { id: coin.id, kind: 'coin' as const, position: coin.position, x: p.x - p.radius, y: p.y - p.radius,
      size: p.radius * 2, opacity: p.opacity, front: coin.position < state.distance, magnet: coin.lateral !== undefined };
  });
  return [...objects, ...coins].sort((a, b) => b.position - a.position);
}

export type ProjectedEntity = ReturnType<typeof projectEntities>[number];
