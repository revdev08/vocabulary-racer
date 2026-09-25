import type { MapTheme } from '../config/maps';
import { driving } from '../config/driving';
import { positiveModulo } from '../motion/simulation';
import { GROUND_PROJECTION_SKSL, type Camera } from './perspective';

/** Road-edge noise: 40 lattice rows of 0.3 units, so its z pattern wraps exactly every 12 units. */
const EDGE_PERIOD = 12;

/** With spilled material the asphalt runs under the verge's start (curb 1.54) instead of
 * feathering out at 1.5, which would leave a dark strip of the plate between them. */
export function roadHalfWidth(theme: MapTheme) {
  'worklet';
  return theme.roadEdge ? 1.56 : 1.5;
}

/** Uniforms of ROAD_SKSL for one frame; shared by the Road component and the render tests. */
export function roadUniforms(camera: Camera, theme: MapTheme, tileSize: number, distance: number) {
  'worklet';
  const edge = theme.roadEdge;
  return {
    centerX: camera.centerX, horizon: camera.horizonY,
    groundHeight: camera.groundHeight, laneWidth: camera.nearLaneWidth,
    tileSize, hazeOpacity: theme.background.roadHazeOpacity, roadColor: [...theme.colors.asphalt], fogColor: [...theme.colors.fog],
    // Keep GPU float precision even after hours of driving.
    textureTravel: positiveModulo(distance, 1 / driving.road.textureRepeatsPerUnit),
    textureRepeats: driving.road.textureRepeatsPerUnit,
    edgeColor: [...(edge?.color ?? [0, 0, 0])], edgeShape: [edge?.amount ?? 0, edge?.width ?? 0],
    edgeTravel: positiveModulo(distance, EDGE_PERIOD),
  };
}

// The texture and projected segments share one distance travelled by the camera.
export const ROAD_SKSL = `
  uniform shader asphalt;
  ${GROUND_PROJECTION_SKSL}
  uniform float3 roadColor;
  uniform float3 fogColor;
  uniform float tileSize;
  uniform float hazeOpacity;
  uniform float textureTravel;
  uniform float textureRepeats;
  uniform float3 edgeColor;
  uniform float2 edgeShape;
  uniform float edgeTravel;

  // 40 lattice rows of 0.3 units = EDGE_PERIOD, the wrap of edgeTravel (80 rows for the finer octave).
  float edgeHash(float2 cell, float rows) {
    cell.y = mod(cell.y, rows);
    return fract(sin(dot(cell, float2(127.1, 311.7))) * 43758.5453);
  }
  float edgeNoise(float2 p, float rows) {
    float2 cell = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(edgeHash(cell, rows), edgeHash(cell + float2(1, 0), rows), f.x),
               mix(edgeHash(cell + float2(0, 1), rows), edgeHash(cell + float2(1, 1), rows), f.x), f.y);
  }

  half4 main(float2 xy) {
    float t = max((xy.y - horizon) / groundHeight, 0.008);
    float2 world = groundPosition(xy);
    float worldX = world.x;
    half3 texture = asphalt.eval(float2(worldX * tileSize * 0.7, (world.y + textureTravel) * tileSize * textureRepeats)).rgb;
    half grain = dot(texture, half3(0.299, 0.587, 0.114));
    half3 road = half3(roadColor) + (grain - 0.43) * 0.18;
    if (edgeShape.x > 0.0) {
      // Sand, snow or gravel spilling onto the asphalt: an irregular band along both edges,
      // fixed in world space so it streams past. Far away it averages out instead of shimmering.
      float2 cellPosition = float2(abs(worldX) * 4.0 + (worldX < 0.0 ? 17.0 : 0.0), (world.y + edgeTravel) / 0.3);
      float far = smoothstep(10.0, 24.0, world.y);
      float coarse = mix(edgeNoise(cellPosition, 40.0), 0.5, far);
      float fine = mix(edgeNoise(cellPosition * 2.0 + 5.0, 80.0), 0.5, far);
      float n = coarse * 0.7 + fine * 0.3;
      float inner = 1.5 - edgeShape.y * (0.3 + 0.95 * n);
      float cover = smoothstep(inner, inner + 0.07, abs(worldX)) * edgeShape.x;
      road = mix(road, half3(edgeColor) * (0.9 + 0.2 * fine), cover);
    }
    float haze = pow(1.0 - min(t, 1.0), 7.0) * hazeOpacity;
    road = mix(road, half3(fogColor), haze);
    // Keep the distant plate's lighting and blend into our textured foreground.
    // Feather the road edges instead of painting a hard triangle over the city; with spilled
    // material the band runs under the verge instead (see roadHalfWidth).
    float outer = edgeShape.x > 0.0 ? 1.0 - smoothstep(1.50, 1.56, abs(worldX)) : 1.0 - smoothstep(1.39, 1.51, abs(worldX));
    float alpha = smoothstep(0.02, 0.48, t) * outer;
    return half4(road * alpha, alpha);
  }
`;
