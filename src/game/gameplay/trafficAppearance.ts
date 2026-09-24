import { trafficVariants, type TrafficVariant } from '../config/traffic';
import { random } from './random';

/** Cosmetic shuffle: never consumes the seed used for hazards or vocabulary. */
export function trafficAppearanceOrder(planSeed: number, firstObjectId: number): TrafficVariant[] {
  'worklet';
  // Avalanche the planner's final seed so its lane constraints cannot bias paint order.
  let mixed = (planSeed ^ Math.imul(firstObjectId, 0x9e3779b9)) >>> 0;
  mixed = Math.imul(mixed ^ (mixed >>> 16), 0x45d9f3b);
  mixed ^= mixed >>> 16;
  let seed = (mixed >>> 0) % 2147483646 + 1;
  const variants: TrafficVariant[] = [...trafficVariants];
  for (let i = variants.length - 1; i > 0; i--) {
    const next = random(seed); seed = next.seed;
    const j = Math.floor(next.value * (i + 1));
    const saved = variants[i]; variants[i] = variants[j]; variants[j] = saved;
  }
  return variants;
}
