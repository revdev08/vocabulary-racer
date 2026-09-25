import { Group, Image, RadialGradient, Rect, vec, type SkImage } from '@shopify/react-native-skia';
import type { MapTheme } from '../config/maps';
import { backdropPlacement } from '../geometry/backdrop';
import type { SceneLayout } from '../geometry/perspective';

export function CityBackdrop({ layout, image, theme }: { layout: SceneLayout; image: SkImage; theme: MapTheme }) {
  const { width, height, camera } = layout;
  const config = theme.background;
  const { x, y, width: drawWidth, height: drawHeight } = backdropPlacement(layout, image.width(), image.height(), config);

  return <Group>
    <Image image={image} x={x} y={y} width={drawWidth} height={drawHeight} fit="fill" />
    <Rect x={0} y={0} width={width} height={height} opacity={config.atmosphereOpacity}>
      <RadialGradient c={vec(camera.centerX, camera.horizonY)} r={width * 0.22} colors={[config.atmosphereColor, `${config.atmosphereColor}00`]} />
    </Rect>
  </Group>;
}
