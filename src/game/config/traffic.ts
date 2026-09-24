import { objectVisuals } from './gameplay';

export const trafficVariants = ['yellow', 'blue', 'white', 'green'] as const;
export type TrafficVariant = typeof trafficVariants[number];

export const trafficSourceSize = 1254;
type SpriteBounds = { left: number; right: number; top: number; bottom: number };

// Visible bounds (alpha > 32). The approved yellow registration is unchanged.
export const trafficSpriteBounds: Record<TrafficVariant, SpriteBounds> = {
  yellow: objectVisuals.traffic,
  blue: { left: 86 / 1254, right: 1168 / 1254, top: 195 / 1254, bottom: 1107 / 1254 },
  white: { left: 57 / 1254, right: 1198 / 1254, top: 173 / 1254, bottom: 1103 / 1254 },
  green: { left: 48 / 1254, right: 1205 / 1254, top: 190 / 1254, bottom: 1075 / 1254 },
};

function registerSprite(bounds: SpriteBounds) {
  const canonical = objectVisuals.traffic;
  const scale = (canonical.right - canonical.left) / (bounds.right - bounds.left);
  return {
    x: (canonical.left + canonical.right) / 2 - scale * (bounds.left + bounds.right) / 2,
    y: canonical.bottom - scale * bounds.bottom,
    width: scale, height: scale,
  };
}

// Compute once. Every model retains its aspect ratio, lane width and tire baseline.
export const trafficFrames = Object.fromEntries(trafficVariants.map(variant =>
  [variant, registerSprite(trafficSpriteBounds[variant])])) as Record<TrafficVariant, ReturnType<typeof registerSprite>>;
