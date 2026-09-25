import { Group, ImageShader, LinearGradient, Path, Shader, Skia, vec, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import { palette, scene } from '../config/visual';
import type { MapTheme } from '../config/maps';
import { driving } from '../config/driving';
import { groundQuad, polygonPath, type SceneLayout } from '../geometry/perspective';
import { ROAD_SKSL, roadHalfWidth, roadUniforms } from '../geometry/roadShader';
import { roadSegment } from '../motion/simulation';
import { useMemo } from 'react';

const asphaltEffect = Skia.RuntimeEffect.Make(ROAD_SKSL);

if (!asphaltEffect) throw new Error('No se pudo preparar el shader de perspectiva del asfalto.');

export function Road({ layout, asphalt, distance, theme }: { layout: SceneLayout; asphalt: SkImage; distance: SharedValue<number>; theme: MapTheme }) {
  const { camera } = layout;
  const tileSize = asphalt.width();
  const quad = (left: number, right: number, far = 120, near = 1) =>
    polygonPath(groundQuad(camera, left, right, far, near));
  // Asphalt is one stationary plane; only its texture and the lane dashes travel.
  const half = roadHalfWidth(theme);
  const surface = useMemo(() => polygonPath(groundQuad(camera, -half, half, 120, driving.road.nearClip)), [camera, half]);
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
  const uniforms = useDerivedValue(() => roadUniforms(camera, theme, tileSize, distance.value), [camera, tileSize, distance, theme]);

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
