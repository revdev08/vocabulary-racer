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
  /** Keep only the top and bottom fractions of the atlas, dropping repeated middle floors. */
  rows?: { top: number; bottom: number };
};
export type RoadsideConfig = {
  lateral: number; height: number; spacing: number; countPerSide: number; near: number; rightOffset: number;
  anchorY: number; left: boolean; right: boolean;
  /** Optional RGB modulation in the existing Atlas color buffer. */
  tint?: Rgb;
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
  /** Aerial perspective: walls and verges blend toward colors.fog between these depths. */
  atmosphere: { amount: number; start: number; end: number };
  /** Wall light from base (shade) to top (sun), multiplied over the atlas colors. */
  light: { top: Rgb; base: Rgb };
  /** Sand, snow or gravel spilling onto the asphalt edges; width in lanes. */
  roadEdge?: { color: Rgb; amount: number; width: number };
  weather?: 'snow';
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
  atmosphere: { amount: .26, start: 3, end: 18 },
  light: { top: [1.04, 1.02, 1], base: [.93, .95, 1] },
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
  // The 512:1536 house panel needs height ≈ 3 × module; 3 × 4.8 squashed it to half height.
  left: { wall: 2.75, height: 4.6, heightVariation: 0, moduleLength: 1.5, atlasVariant: 0,
    wallTint: [.96, .98, 1], ground: coastalGround, sky: true },
  // Sea colors sampled from the plate's water (far ≈ y700–770, nearer ≈ y880) so the fade is seamless.
  right: { wall: 2.75, height: .38, heightVariation: 0, moduleLength: 3, atlasVariant: 1,
    wallTint: [1, .99, .94], ground: coastalGround,
    sea: { drop: 1.2, near: [.11, .48, .62], far: [.12, .43, .70], solidUntil: 16, fadeEnd: 42 } },
  roadside: { ...cityMap.roadside, height: 1.55, spacing: 2.4, rightOffset: 1.2, countPerSide: 14, anchorY: 1503 / 1536 },
  colors: { sky: '#649EC1', asphalt: [.223, .267, .316], fog: [.52, .60, .64] },
  atmosphere: { amount: .28, start: 3, end: 18 },
  light: { top: [1.05, 1.02, .97], base: [.91, .94, 1] },
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
  // Both 512:1536 atlas halves retain their 1:3 proportions in world space. The cliff was 12 high
  // and hid the peaks on the left; at 6 its crest sits below the pines and the range shows on both sides.
  left: { wall: 2.75, height: 6, heightVariation: 0, moduleLength: 2, atlasVariant: 0,
    mirrorModules: true, sky: true, wallTint: [.94, .97, 1], ground: alpineGround },
  right: { wall: 2.75, height: 7.5, heightVariation: 0, moduleLength: 2.5, atlasVariant: 1,
    mirrorModules: true, sky: true, wallTint: [1, .98, .94], ground: alpineGround },
  // Common repeat of left modules (8), right modules (5), gravel and tree spacing.
  texturePeriod: 40,
  roadside: { ...cityMap.roadside, height: 1.55, spacing: 2, rightOffset: 1, countPerSide: 14, anchorY: 1492 / 1536 },
  colors: { sky: '#609ECA', asphalt: [.223, .267, .316], fog: [.50, .59, .67] },
  atmosphere: { amount: .36, start: 3, end: 18 },
  light: { top: [1.05, 1.04, 1.02], base: [.84, .89, .98] },
  roadEdge: { color: [.40, .40, .37], amount: .4, width: .16 },
};

const desertGround: MapSide['ground'] = {
  material: 'sand', color: [.52, .45, .35], tint: [1, 1, 1], tile: [.3, .3], joints: false, curb: [.57, .51, .42], grain: .14,
};
// 14-high walls left a slit of sky. At ≈7 with the atlas's eroded crest, sky and mesas open up;
// module 2.35 keeps the 1:3 panel undistorted and still divides the 28.2 texture period (×6).
const desertSide: MapSide = {
  wall: 2.75, height: 7, heightVariation: .9, moduleLength: 2.35, atlasVariant: -1,
  wallTint: [.91, .94, .99], ground: desertGround, sky: true,
};
export const desertMap: MapTheme = {
  ...cityMap, id: 'desert',
  assets: { backdrop: 'assets/game/maps/desert/backdrop.png', walls: 'assets/game/maps/desert/walls.png', roadside: 'assets/game/maps/desert/roadside.png' },
  // Measured from 17 pairs of road-edge samples, y800..1200 (max residual 1.04 px).
  background: { vanishingPoint: { x: 513.277710 / 1024, y: 742.714209 / 1536 }, curbSlope: .999460784, widthScale: 1.22,
    curbLaneOffset: 1.54, atmosphereOpacity: .018, roadHazeOpacity: .08, atmosphereColor: '#B1ADA5' },
  left: desertSide,
  right: { ...desertSide, wallTint: [.97, .95, .91] },
  // Three pairs of alternating walls; 12 cactus spacings; integer sand/grain periods.
  texturePeriod: 28.2,
  roadside: { ...cityMap.roadside, height: 1.65, spacing: 2.35, rightOffset: 1.175, countPerSide: 12, anchorY: 1492 / 1536 },
  colors: { sky: '#3485D0', asphalt: [.238, .265, .299], fog: [.57, .59, .63] },
  atmosphere: { amount: .30, start: 3, end: 18 },
  // Sunlit rims, cool shaded bases: gives the flat strata their volume.
  light: { top: [1.10, 1.01, .88], base: [.78, .82, .94] },
  roadEdge: { color: [.55, .48, .38], amount: .8, width: .3 },
};

/** Same street geometry as city, relit at golden hour. */
export const sunsetMap: MapTheme = {
  ...cityMap, id: 'sunset',
  assets: { backdrop: 'assets/game/maps/sunset/backdrop.png', walls: 'assets/game/maps/sunset/walls.png', roadside: cityMap.assets.roadside },
  // Measured inner curb rays in the edited plate, 21 rows; max residual 3.28 px.
  background: { ...cityMap.background, vanishingPoint: { x: 511.571391 / 1024, y: 684.835641 / 1536 }, curbSlope: .459610390,
    atmosphereOpacity: .025, roadHazeOpacity: .10, atmosphereColor: '#BBA2A0' },
  // Warm grey paving instead of mauve; the golden light comes from the walls' light ramp.
  left: { ...cityMap.left, wallTint: [.94, .94, 1],
    ground: { ...cityMap.left.ground, color: [.55, .52, .48], tint: [1, .98, .96], curb: [.56, .53, .51], grain: .09 } },
  right: { ...cityMap.right, wallTint: [1, .96, .89],
    ground: { ...cityMap.right.ground, color: [.55, .52, .48], tint: [1.04, .99, .92], curb: [.58, .54, .50], grain: .09 } },
  roadside: { ...cityMap.roadside, tint: [1, .88, .72] },
  colors: { sky: '#626B91', asphalt: [.230, .251, .292], fog: [.60, .53, .54] },
  atmosphere: { amount: .30, start: 3, end: 18 },
  light: { top: [1.16, .97, .82], base: [.80, .79, .92] },
};

const snowGround: MapSide['ground'] = {
  material: 'snow', color: [.52, .60, .70], tint: [1, 1, 1], tile: [.3, .3], joints: false,
  curb: [.62, .69, .78], grain: .12,
};
export const snowMap: MapTheme = {
  ...cityMap, id: 'snow',
  assets: { backdrop: 'assets/game/maps/snow/backdrop.png', walls: 'assets/game/maps/snow/walls.png', roadside: 'assets/game/maps/snow/roadside.png' },
  // Measured snow/asphalt boundary, 17 pairs; soft snow edges deviate at most 6.22 source pixels.
  background: { vanishingPoint: { x: 512.606567 / 1024, y: 737.527167 / 1536 }, curbSlope: .811960784, widthScale: 1.22,
    curbLaneOffset: 1.54, atmosphereOpacity: .018, roadHazeOpacity: .08, atmosphereColor: '#A1B4CC' },
  // The atlas draws a six-storey chalet. Keep roof + top floor (0–0.345) and the last upper floor +
  // ground floor (0.715–1): both cuts sit just under a balcony bracket, so three storeys join seamlessly.
  // Height = 3 × module × kept rows, so windows keep their drawn proportions. It must also stay above
  // the camera (≈3.8 lane units on tall phones) at the deepest roof gap: at 3.4 the roofline fell below
  // the horizon and the fixed plate showed through as a cut. Module 3 → 5.67 high, lowest crest ≈4.09.
  left: { wall: 2.75, height: 3 * 3 * (.345 + .285), heightVariation: 0, moduleLength: 3, atlasVariant: 0,
    mirrorModules: true, sky: true, wallTint: [.94, .97, 1], ground: snowGround, rows: { top: .345, bottom: .285 } },
  right: { wall: 2.75, height: 7.5, heightVariation: 0, moduleLength: 2.5, atlasVariant: 1,
    mirrorModules: true, sky: true, wallTint: [.96, .98, 1], ground: snowGround },
  // Common repeat of paired chalet (6) and forest (5) modules, ground noise and fir spacing.
  texturePeriod: 90,
  roadside: { ...cityMap.roadside, height: 1.5, spacing: 2.5, rightOffset: 1.25, countPerSide: 12, anchorY: 1465 / 1536 },
  // Slightly darker, wet asphalt so the slush edges and white flakes read against it.
  colors: { sky: '#4088CA', asphalt: [.196, .232, .282], fog: [.50, .59, .70] },
  atmosphere: { amount: .30, start: 3, end: 18 },
  light: { top: [1.03, 1.03, 1.05], base: [.86, .91, 1.02] },
  roadEdge: { color: [.72, .78, .87], amount: .85, width: .26 },
  weather: 'snow',
};

export const mapThemes: Record<MapId, MapTheme> = { city: cityMap, coast: coastMap, mountain: mountainMap, desert: desertMap, sunset: sunsetMap, snow: snowMap };
export const journeyMapCycle: readonly MapId[] = ['coast', 'city', 'mountain', 'desert', 'sunset', 'snow'];
export function getMapTheme(id: string | undefined): MapTheme {
  return mapThemes[id as MapId] ?? cityMap;
}
