import { Group, Image, RadialGradient, Rect, vec, type SkImage } from '@shopify/react-native-skia';
import { scene } from '../config/visual';
import type { SceneLayout } from '../geometry/perspective';

export function CityBackdrop({ layout, image }: { layout: SceneLayout; image: SkImage }) {
  const { width, height, camera } = layout;
  const config = scene.background;
  const widthScale = width * config.widthScale / image.width();
  // Register the plate's curb angle to the existing ground plane. Only this
  // scenery plate is reframed; the road camera, portals and player are unchanged.
  const curbSlope = camera.nearLaneWidth * config.curbLaneOffset / camera.groundHeight;
  const heightScale = widthScale * config.curbSlope / curbSlope;
  // Cover above AND below the horizon on short and tall screens. Uniform cover
  // preserves the registered curb angle and never exposes an unpainted lower edge.
  const cover = Math.max(
    1,
    camera.horizonY / (image.height() * heightScale * config.vanishingPoint.y),
    (height - camera.horizonY) / (image.height() * heightScale * (1 - config.vanishingPoint.y)),
  );
  const drawWidth = image.width() * widthScale * cover;
  const drawHeight = image.height() * heightScale * cover;
  const x = camera.centerX - drawWidth * config.vanishingPoint.x;
  const y = camera.horizonY - drawHeight * config.vanishingPoint.y;

  return <Group>
    <Image image={image} x={x} y={y} width={drawWidth} height={drawHeight} fit="fill" />
    <Rect x={0} y={0} width={width} height={height} opacity={config.atmosphereOpacity}>
      <RadialGradient c={vec(camera.centerX, camera.horizonY)} r={width * 0.22} colors={['#BDCCD9', '#BDCCD900']} />
    </Rect>
  </Group>;
}
