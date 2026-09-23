import { gameplay } from '../config/gameplay';
import type { Lane } from '../motion/simulation';
import { validateRoute } from './patterns';
import type { TrafficPlan, WorldCoin } from './types';

/** Rewards a proven driving route; this module has no question/correct-lane input. */
export function makeCoins(plan: TrafficPlan, distance: number, firstId: number) {
  'worklet';
  let route = plan.route;
  if (plan.pattern === 'coinDetour') {
    for (const lane of [-1, 0, 1] as Lane[]) {
      if (lane === plan.route[0]) continue;
      const alternative = validateRoute(plan.encounters, plan.initialLateral, lane, plan.cruiseSpeed);
      if (alternative) { route = alternative; break; }
    }
  }
  const coins: WorldCoin[] = [];
  // Only two coins together; choose the second group in a DIFFERENT reachable lane.
  let secondRow = plan.encounters.length - 1;
  while (secondRow > 0 && route[secondRow] === route[0]) secondRow--;
  const rows = secondRow > 0 ? [0, secondRow] : [0];
  for (const rowIndex of rows) {
    const row = plan.encounters[rowIndex];
    for (let i = 0; i < gameplay.coinsPerLine; i++) {
      const time = row.time + (i - (gameplay.coinsPerLine - 1) / 2) * gameplay.coinSpacingSeconds;
      coins.push({ id: firstId + coins.length, lane: route[rowIndex], position: distance + plan.cruiseSpeed * time });
    }
  }
  return { coins, route };
}
