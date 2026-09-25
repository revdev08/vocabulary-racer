import type { MapTheme } from '../config/maps';
import { positiveModulo } from '../motion/simulation';
import { GROUND_PROJECTION_SKSL, type Camera } from './perspective';

type Rect = { x: number; y: number; width: number; height: number };

/** Uniforms of SCENERY_SURFACES_SKSL for one frame; shared by the component and the render tests. */
export function sceneryUniforms(camera: Camera, theme: MapTheme, plate: Rect, wallsSize: readonly [number, number],
  backdropSize: readonly [number, number], distance: number) {
  'worklet';
  const { left, right, roadside } = theme;
  const sea = right.sea ?? left.sea;
  return {
    centerX: camera.centerX, horizon: camera.horizonY,
    groundHeight: camera.groundHeight, laneWidth: camera.nearLaneWidth,
    backdropRect: [plate.x, plate.y, plate.width, plate.height], backdropSize: [backdropSize[0], backdropSize[1]],
    skyAbove: [Number(!!left.sky), Number(!!right.sky)], seaDrop: [left.sea?.drop ?? 0, right.sea?.drop ?? 0],
    seaNear: [...(sea?.near ?? [0, 0, 0])], seaFar: [...(sea?.far ?? [0, 0, 0])],
    seaFade: [sea?.solidUntil ?? 1, sea?.fadeEnd ?? 2],
    travel: positiveModulo(distance, theme.texturePeriod),
    imageSize: [wallsSize[0], wallsSize[1]], curb: theme.curb,
    leftWall: [left.wall, left.height, left.moduleLength, left.heightVariation],
    rightWall: [right.wall, right.height, right.moduleLength, right.heightVariation],
    wallVariants: [left.atlasVariant, right.atlasVariant],
    leftWallTint: [...left.wallTint], rightWallTint: [...right.wallTint],
    leftGround: [...left.ground.color], rightGround: [...right.ground.color],
    leftGroundTint: [...left.ground.tint], rightGroundTint: [...right.ground.tint],
    leftCurb: [...left.ground.curb], rightCurb: [...right.ground.curb],
    leftTiling: [...left.ground.tile, Number(left.ground.joints)],
    rightTiling: [...right.ground.tile, Number(right.ground.joints)],
    treesEnabled: [Number(roadside.left), Number(roadside.right)], texturePeriod: theme.texturePeriod,
    solidUntil: theme.solidUntil, fadeEnd: theme.fadeEnd,
    treeSpacing: roadside.spacing, treeLateral: roadside.lateral,
    treeNear: roadside.near, rightOffset: roadside.rightOffset,
  };
}

// Two world planes, not a translated background image. Texture coordinates are
// obtained by inverting the same camera that projects the car and road segments.
// Kept outside the component so tests can compile and render it with CanvasKit.
export const SCENERY_SURFACES_SKSL = `
  uniform shader facades;
  uniform shader backdrop;
  ${GROUND_PROJECTION_SKSL}
  uniform float4 backdropRect;
  uniform float2 backdropSize;
  uniform float2 skyAbove;
  uniform float2 seaDrop;
  uniform float3 seaNear;
  uniform float3 seaFar;
  uniform float2 seaFade;
  uniform float travel;
  uniform float2 imageSize;
  uniform float curb;
  uniform float4 leftWall;
  uniform float4 rightWall;
  uniform float2 wallVariants;
  uniform float3 leftWallTint;
  uniform float3 rightWallTint;
  uniform float3 leftGround;
  uniform float3 rightGround;
  uniform float3 leftGroundTint;
  uniform float3 rightGroundTint;
  uniform float3 leftCurb;
  uniform float3 rightCurb;
  uniform float3 leftTiling;
  uniform float3 rightTiling;
  uniform float2 treesEnabled;
  uniform float texturePeriod;
  uniform float solidUntil;
  uniform float fadeEnd;
  uniform float treeSpacing;
  uniform float treeLateral;
  uniform float treeNear;
  uniform float rightOffset;

  float visibility(float depth) { return 1.0 - smoothstep(solidUntil, fadeEnd, depth); }

  half3 facadeSample(float2 uv, float variant) {
    uv.x = clamp(uv.x, (variant * 0.5 + 0.001) * imageSize.x,
                      ((variant + 1.0) * 0.5 - 0.001) * imageSize.x);
    uv.y = clamp(uv.y, 0.001 * imageSize.y, 0.999 * imageSize.y);
    return facades.eval(uv).rgb;
  }

  half4 main(float2 xy) {
    float dx = xy.x - centerX;
    if (abs(dx) < 0.5) return half4(0);
    float side = dx < 0.0 ? -1.0 : 1.0;
    float4 wallConfig = side < 0.0 ? leftWall : rightWall;
    float wall = wallConfig.x, facadeHeight = wallConfig.y, facadeLength = wallConfig.z;
    float atlasVariant = side < 0.0 ? wallVariants.x : wallVariants.y;
    float3 tiling = side < 0.0 ? leftTiling : rightTiling;
    float2 wallPoint = wallPosition(xy, side * wall);
    float z = wallPoint.x;
    float elevation = wallPoint.y;
    // Neighbouring modules have different heights and materials. Their boundary
    // travels in world space, so the skyline does not breathe or scroll vertically.
    float blockPosition = (z + travel + (side > 0.0 ? 3.0 : 0.0)) / facadeLength;
    float block = floor(blockPosition);
    float variant = atlasVariant < 0.0 ? mod(block, 2.0) : atlasVariant;
    float buildingHeight = facadeHeight + variant * wallConfig.w;
    if (buildingHeight > 0.0 && elevation >= 0.0 && elevation <= buildingHeight && z < fadeEnd) {
      float u = fract(blockPosition);
      if (side < 0.0) u = 1.0 - u;
      float2 uv = float2((variant + clamp(u, 0.002, 0.998)) * 0.5 * imageSize.x,
                        clamp(1.0 - elevation / buildingHeight, 0.001, 0.999) * imageSize.y);
      half3 color = facadeSample(uv, variant);
      if (z > 5.0) {
        // Anisotropic screen footprint: subpixel window grids otherwise shimmer
        // as they approach. Four taps only in the small, minified distant region.
        float dzdx = -z / dx;
        float2 footprintX = float2((side < 0.0 ? -1.0 : 1.0) * dzdx * imageSize.x / (2.0 * facadeLength),
                                   (xy.y - horizon) * dzdx * imageSize.y / (laneWidth * buildingHeight)) * 0.3;
        float2 footprintY = float2(0.0, z * imageSize.y / (laneWidth * buildingHeight)) * 0.3;
        half3 filtered = (facadeSample(uv + footprintX + footprintY, variant)
                       + facadeSample(uv + footprintX - footprintY, variant)
                       + facadeSample(uv - footprintX + footprintY, variant)
                       + facadeSample(uv - footprintX - footprintY, variant)) * 0.25;
        color = mix(color, filtered, smoothstep(5.0, 8.0, z));
      }
      // Shade ground floors and the cooler street side without changing the art.
      color *= mix(0.74, 1.0, smoothstep(0.0, 4.0, elevation));
      color *= side < 0.0 ? half3(leftWallTint) : half3(rightWallTint);
      float join = 1.0 - smoothstep(0.0, 0.012, min(u, 1.0 - u));
      color *= 1.0 - join * 0.22;
      float alpha = visibility(z);
      return half4(color * alpha, alpha);
    }

    // Low rooflines expose the plate above them, and its houses cannot move with the road.
    // Above the roofline at ANY depth show sky: the plate's open side, mirrored, stays correct while
    // static. Only the thin band below the extended roofline near the vanishing point keeps the plate.
    if ((side < 0.0 ? skyAbove.x : skyAbove.y) > 0.5 && buildingHeight > 0.0 && elevation > buildingHeight
        && xy.y < horizon && z > 0.0) {
      float2 uv = (float2(2.0 * centerX - xy.x, xy.y) - backdropRect.xy) / backdropRect.zw * backdropSize;
      return half4(backdrop.eval(clamp(uv, float2(0.5), backdropSize - 0.5)).rgb, 1.0);
    }

    if (xy.y <= horizon) return half4(0);
    float2 ground = groundPosition(xy);
    float x = abs(ground.x);
    z = ground.y;
    float drop = side < 0.0 ? seaDrop.x : seaDrop.y;
    if (drop > 0.0 && x > wall + 0.02) {
      // The ray clears the parapet and falls to open water below the promenade. The pattern is
      // fixed in world space, so it streams past like the road; z frequencies are multiples of
      // 2π/texturePeriod (12) to wrap seamlessly with the travel uniform.
      float zs = (groundHeight + drop * laneWidth) / (xy.y - horizon);
      float2 w = float2(abs(dx) * zs / laneWidth, zs + travel);
      half3 water = mix(half3(seaNear), half3(seaFar), smoothstep(2.0, 26.0, zs));
      float swell = sin(w.y * 1.0472 + sin(w.x * 0.9) * 1.2) * 0.5 + 0.5;
      float chop = sin(w.y * 2.0944 - w.x * 1.3) * 0.5 + 0.5;
      float ripple = sin(w.y * 6.2832 + w.x * 5.1 + sin(w.x * 1.7) * 2.0) * sin(w.y * 4.1888 - w.x * 3.7);
      // High frequencies fade with distance before they can alias into shimmer.
      float detail = 1.0 - smoothstep(3.0, 12.0, zs);
      water *= 0.90 + swell * 0.08 + chop * 0.05;
      water += half3(0.78, 0.90, 0.98) * pow(max(ripple, 0.0), 10.0) * 0.30 * detail;
      float alpha = 1.0 - smoothstep(seaFade.x, seaFade.y, zs);
      return half4(water * alpha, alpha);
    }
    if (x < curb || x > wall + 0.02) return half4(0);
    float worldZ = z + travel;
    // World-space paving joints expand and pass beneath the camera with the road.
    float tileX = (x - curb) / tiling.x;
    float tileZ = worldZ / tiling.y;
    float edgeX = min(fract(tileX), 1.0 - fract(tileX)) * tiling.x;
    float edgeZ = min(fract(tileZ), 1.0 - fract(tileZ)) * tiling.y;
    float aaX = z / laneWidth;
    float aaZ = z * z / groundHeight;
    float joints = max(1.0 - smoothstep(0.003, 0.003 + aaX, edgeX),
                       1.0 - smoothstep(0.004, 0.004 + aaZ, edgeZ));
    // Periodic tile variation, matching the wrapped travel uniform exactly.
    float cell = floor(tileX) * 7.0 + mod(floor(tileZ), floor(texturePeriod / tiling.y + 0.5)) * 3.0;
    float variation = fract(sin(cell * 1.73) * 153.91) * 0.035;
    half3 pavement = (side < 0.0 ? half3(leftGround) : half3(rightGround)) + variation;
    pavement *= side < 0.0 ? half3(leftGroundTint) : half3(rightGroundTint);
    pavement *= 1.0 - joints * 0.14 * tiling.z;
    // Contact shade against the building and below each independently drawn tree.
    pavement *= 1.0 - smoothstep(wall - 0.35, wall, x) * 0.24;
    float treeZ = mod(worldZ + (side > 0.0 ? rightOffset : 0.0) - treeNear + treeSpacing * 0.5, treeSpacing) - treeSpacing * 0.5;
    float shade = exp(-pow((x - treeLateral + 0.03) / 0.28, 2.0) - pow((treeZ + 0.04) / 0.28, 2.0));
    pavement *= 1.0 - shade * 0.24 * (side < 0.0 ? treesEnabled.x : treesEnabled.y);
    if (x < curb + 0.055) {
      pavement = (side < 0.0 ? half3(leftCurb) : half3(rightCurb)) * (0.78 + smoothstep(curb, curb + 0.018, x) * 0.22);
      pavement *= 1.0 - (1.0 - smoothstep(0.004, 0.004 + aaZ, edgeZ)) * 0.20 * tiling.z;
    }
    float alpha = visibility(z);
    return half4(pavement * alpha, alpha);
  }
`;
