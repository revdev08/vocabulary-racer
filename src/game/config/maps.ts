import { scenery } from './scenery';
import { palette, scene } from './visual';

export type MapId = 'city' | 'coast' | 'mountain' | 'desert' | 'sunset' | 'snow';
export type Rgb = readonly [number, number, number];
export type MapSide = {
  wall: number;
  height: number;
  heightVariation: number;
  moduleLength: number;
  /** -1 alternates both halves; 0/1 selects one half of the wall atlas. */
  atlasVariant: number;
  /** Reflect consecutive natural modules so their irregular crests meet at the same edge. */
  mirrorModules?: boolean;
  wallTint: Rgb;
  ground: { material: string; color: Rgb; tint: Rgb; tile: readonly [number, number]; joints: boolean; curb: Rgb; grain?: number };
  /** Low walls leave the plate's near scenery exposed, and a fixed image cannot move with the road.
   * sky: above the moving roofline, show static sky (the plate mirrored from the open side) instead.
   * sea: beyond the parapet, draw moving water on a plane `drop` units below the road. */
  sky?: boolean;
  sea?: { drop: number; near: Rgb; far: Rgb; solidUntil: number; fadeEnd: number };
};
export type RoadsideConfig = {
  lateral: number; height: number; spacing: number; countPerSide: number; near: number; rightOffset: number;
  anchorY: number; left: boolean; right: boolean;
};
export type MapTheme = {
  id: MapId;
  assets: { backdrop: string; walls: string; roadside: string; asphalt?: string };
  background: { vanishingPoint: { x: number; y: number }; curbSlope: number; widthScale: number;
    curbLaneOffset: number; atmosphereOpacity: number; roadHazeOpacity: number; atmosphereColor: string };
  left: MapSide; right: MapSide;
  curb: number; texturePeriod: number; solidUntil: number; fadeEnd: number;
  roadside: RoadsideConfig;
  colors: { sky: string; asphalt: Rgb; fog: Rgb };
};

const citySide: MapSide = {
  wall: scenery.wall, height: scenery.facadeHeight, heightVariation: 2, moduleLength: scenery.facadeLength,
  atlasVariant: -1, wallTint: [.94, .97, 1],
  ground: { material: 'pavement', color: [.70, .70, .68], tint: [.96, .98, 1], tile: [.30, .40], joints: true, curb: [.66, .69, .70] },
};
export const cityMap: MapTheme = {
  id: 'city',
  assets: { backdrop: 'assets/game/backgrounds/background_city_v3.png', walls: 'assets/game/scenery/facades_city.png',
    roadside: 'assets/game/scenery/tree_planter.png' },
  background: { ...scene.background, atmosphereColor: '#BDCCD9' },
  left: citySide,
  right: { ...citySide, wallTint: [1, .96, .89], ground: { ...citySide.ground, tint: [1.06, 1.01, .91] } },
  curb: scenery.curb, texturePeriod: scenery.texturePeriod, solidUntil: scenery.solidUntil, fadeEnd: scenery.fadeEnd,
  roadside: { ...scenery.trees, anchorY: 1, left: true, right: true },
  colors: { sky: palette.sky, asphalt: [.223, .267, .316], fog: [.55, .64, .73] },
};
const coastalGround: MapSide['ground'] = {
  material: 'limestone', color: [.69, .66, .57], tint: [1, 1, 1], tile: [.40, .40], joints: true, curb: [.70, .69, .62],
};
export const coastMap: MapTheme = {
  ...cityMap, id: 'coast',
  assets: { backdrop: 'assets/game/maps/coast/backdrop.png', walls: 'assets/game/maps/coast/walls.png', roadside: 'assets/game/maps/coast/roadside.png' },
  // Measured from the generated plate's two curb rays, not the requested prompt coordinates.
  background: { vanishingPoint: { x: 514.328187 / 1024, y: 669.014957 / 1536 }, curbSlope: .514232578, widthScale: 1.22,
    curbLaneOffset: 1.54, atmosphereOpacity: .018, roadHazeOpacity: .08, atmosphereColor: '#ADBCBA' },
  left: { wall: 2.75, height: 4.8, heightVariation: 0, moduleLength: 3, atlasVariant: 0,
    wallTint: [.96, .98, 1], ground: coastalGround, sky: true },
  // Sea colors sampled from the plate's water (far ≈ y700–770, nearer ≈ y880) so the fade is seamless.
  right: { wall: 2.75, height: .38, heightVariation: 0, moduleLength: 3, atlasVariant: 1,
    wallTint: [1, .99, .94], ground: coastalGround,
    sea: { drop: 1.2, near: [.11, .48, .62], far: [.12, .43, .70], solidUntil: 16, fadeEnd: 42 } },
  roadside: { ...cityMap.roadside, height: 1.55, spacing: 2.4, rightOffset: 1.2, countPerSide: 14, anchorY: 1503 / 1536 },
  colors: { sky: '#649EC1', asphalt: [.223, .267, .316], fog: [.52, .60, .64] },
};

const alpineGround: MapSide['ground'] = {
  material: 'gravel', color: [.43, .43, .39], tint: [1, 1, 1], tile: [.4, .4], joints: false, curb: [.52, .54, .52], grain: .16,
};
export const mountainMap: MapTheme = {
  ...cityMap, id: 'mountain',
  assets: { backdrop: 'assets/game/maps/mountain/backdrop.png', walls: 'assets/game/maps/mountain/walls.png', roadside: 'assets/game/maps/mountain/roadside.png' },
  // 21 measured curb samples, y800..1300; maximum fit residual is 1.29 source pixels.
  background: { vanishingPoint: { x: 508.788228 / 1024, y: 702.690421 / 1536 }, curbSlope: .813532468, widthScale: 1.22,
    curbLaneOffset: 1.54, atmosphereOpacity: .018, roadHazeOpacity: .08, atmosphereColor: '#A6B8C5' },
  // Both 512:1536 atlas halves retain their 1:3 proportions in world space.
  left: { wall: 2.75, height: 12, heightVariation: 0, moduleLength: 4, atlasVariant: 0,
    mirrorModules: true, sky: true, wallTint: [.94, .97, 1], ground: alpineGround },
  right: { wall: 2.75, height: 7.5, heightVariation: 0, moduleLength: 2.5, atlasVariant: 1,
    mirrorModules: true, sky: true, wallTint: [1, .98, .94], ground: alpineGround },
  // Common repeat of left modules (8), right modules (5), gravel and tree spacing.
  texturePeriod: 40,
  roadside: { ...cityMap.roadside, height: 1.55, spacing: 2, rightOffset: 1, countPerSide: 14, anchorY: 1492 / 1536 },
  colors: { sky: '#609ECA', asphalt: [.223, .267, .316], fog: [.50, .59, .67] },
};

/** Only completed maps are registered. Future unit themes fall back explicitly to city. */
export const mapThemes: Partial<Record<MapId, MapTheme>> = { city: cityMap, coast: coastMap, mountain: mountainMap };
export const journeyMapCycle: readonly MapId[] = ['coast', 'city', 'mountain', 'desert', 'sunset', 'snow'];
export function getMapTheme(id: string | undefined): MapTheme {
  return mapThemes[id as MapId] ?? cityMap;
}
