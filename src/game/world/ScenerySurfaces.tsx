import { useMemo } from 'react';
import { ImageShader, Rect, Shader, Skia, type SkImage } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { MapTheme } from '../config/maps';
import { backdropPlacement } from '../geometry/backdrop';
import type { SceneLayout } from '../geometry/perspective';
import { SCENERY_SURFACES_SKSL, sceneryUniforms } from '../geometry/sceneryShader';

const surfaces = Skia.RuntimeEffect.Make(SCENERY_SURFACES_SKSL);

if (!surfaces) throw new Error('No se pudo preparar la perspectiva de la ciudad.');

export function ScenerySurfaces({ layout, image, backdrop, distance, theme }: {
  layout: SceneLayout; image: SkImage; backdrop: SkImage; distance: SharedValue<number>; theme: MapTheme;
}) {
  const { camera, width, height } = layout;
  const imageWidth = image.width(), imageHeight = image.height();
  const backdropWidth = backdrop.width(), backdropHeight = backdrop.height();
  const plate = useMemo(() => backdropPlacement(layout, backdropWidth, backdropHeight, theme.background),
    [layout, backdropWidth, backdropHeight, theme.background]);
  const uniforms = useDerivedValue(() => sceneryUniforms(camera, theme, plate,
    [imageWidth, imageHeight], [backdropWidth, backdropHeight], distance.value),
  [camera, distance, imageWidth, imageHeight, theme, plate, backdropWidth, backdropHeight]);

  return <Rect x={0} y={0} width={width} height={height}>
    <Shader source={surfaces!} uniforms={uniforms}>
      <ImageShader image={image} fit="none" tx="clamp" ty="clamp"
        sampling={{ B: 1 / 3, C: 1 / 3 }} />
      <ImageShader image={backdrop} fit="none" tx="clamp" ty="clamp" />
    </Shader>
  </Rect>;
}
