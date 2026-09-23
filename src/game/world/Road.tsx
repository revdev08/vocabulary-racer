import { Group, ImageShader, LinearGradient, Path, Shader, Skia, vec, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { palette, scene } from '../config/visual';
import { driving } from '../config/driving';
import { GROUND_PROJECTION_SKSL, groundQuad, polygonPath, type SceneLayout } from '../geometry/perspective';
import { positiveModulo, roadSegment } from '../motion/simulation';
import { useMemo } from 'react';

// The texture and projected segments share one distance travelled by the camera.
const asphaltEffect = Skia.RuntimeEffect.Make(`
  uniform shader asphalt;
  ${GROUND_PROJECTION_SKSL}
  uniform float tileSize;
  uniform float hazeOpacity;
  uniform float textureTravel;
  uniform float textureRepeats;

  half4 main(float2 xy) {
    float t = max((xy.y - horizon) / groundHeight, 0.008);
    float2 world = groundPosition(xy);
    float worldX = world.x;
    half3 texture = asphalt.eval(float2(worldX * tileSize * 0.7, (world.y + textureTravel) * tileSize * textureRepeats)).rgb;
    half grain = dot(texture, half3(0.299, 0.587, 0.114));
    half3 road = half3(0.223, 0.267, 0.316) + (grain - 0.43) * 0.18;
    float haze = pow(1.0 - min(t, 1.0), 7.0) * hazeOpacity;
    road = mix(road, half3(0.55, 0.64, 0.73), haze);
    // Keep the distant plate's lighting and blend into our textured foreground.
    // Feather the road edges instead of painting a hard triangle over the city.
    float alpha = smoothstep(0.02, 0.48, t) * (1.0 - smoothstep(1.39, 1.51, abs(worldX)));
    return half4(road * alpha, alpha);
  }
`);

if (!asphaltEffect) throw new Error('No se pudo preparar el shader de perspectiva del asfalto.');

export function Road({ layout, asphalt, distance }: { layout: SceneLayout; asphalt: SkImage; distance: SharedValue<number> }) {
  const { camera } = layout;
  const tileSize = asphalt.width();
  const quad = (left: number, right: number, far = 120, near = 1) =>
    polygonPath(groundQuad(camera, left, right, far, near));
  // Asphalt is one stationary plane; only its texture and the lane dashes travel.
  const surface = useMemo(() => polygonPath(groundQuad(camera, -1.5, 1.5, 120, driving.road.nearClip)), [camera]);
  const markings = useDerivedValue(() => {
    const markings = Skia.PathBuilder.Make().setIsVolatile(true);
    for (let index = 0; index < driving.road.segmentCount; index++) {
      const segment = roadSegment(index, distance.value);
      if (segment.dashFar > segment.near) {
        for (const divider of scene.laneDividers) {
          markings.addPoly(groundQuad(camera, divider - 0.014, divider + 0.014, segment.dashFar, segment.near), true);
        }
      }
    }
    return markings.detach();
  }, [camera, distance]);
  const uniforms = useDerivedValue(() => ({
    centerX: camera.centerX, horizon: camera.horizonY,
    groundHeight: camera.groundHeight, laneWidth: camera.nearLaneWidth,
    tileSize, hazeOpacity: scene.background.roadHazeOpacity,
    // Keep GPU float precision even after hours of driving.
    textureTravel: positiveModulo(distance.value, 1 / driving.road.textureRepeatsPerUnit),
    textureRepeats: driving.road.textureRepeatsPerUnit,
  }), [camera, tileSize, distance]);

  return <Group>
    <Path path={surface} color={palette.asphalt}>
      <Shader source={asphaltEffect!} uniforms={uniforms}>
        <ImageShader image={asphalt} tx="repeat" ty="repeat" fit="none" />
      </Shader>
    </Path>
    {[-1, 1].map((side) => <Group key={side}>
      {/* The background's grounded sidewalks replace the floating guardrails. */}
      <Path path={quad(side * 1.455, side * 1.477)} color={palette.roadLine} />
    </Group>)}
    <Path path={markings} opacity={0.9}>
      <LinearGradient start={vec(0, camera.horizonY)} end={vec(0, layout.height)} colors={[`${palette.roadLine}00`, `${palette.roadLine}99`, palette.roadLine]} positions={[0, 0.12, 1]} />
    </Path>
  </Group>;
}
