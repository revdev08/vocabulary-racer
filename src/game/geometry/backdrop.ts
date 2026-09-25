import type { MapTheme } from '../config/maps';
import type { SceneLayout } from './perspective';

/** Register image curb rays to the same ground plane used by all world objects. */
export function backdropPlacement(layout: SceneLayout, imageWidth: number, imageHeight: number, config: MapTheme['background']) {
  const { width, height, camera } = layout;
  const widthScale = width * config.widthScale / imageWidth;
  const curbSlope = camera.nearLaneWidth * config.curbLaneOffset / camera.groundHeight;
  const heightScale = widthScale * config.curbSlope / curbSlope;
  const cover = Math.max(1,
    camera.horizonY / (imageHeight * heightScale * config.vanishingPoint.y),
    (height - camera.horizonY) / (imageHeight * heightScale * (1 - config.vanishingPoint.y)));
  const drawWidth = imageWidth * widthScale * cover;
  const drawHeight = imageHeight * heightScale * cover;
  return { x: camera.centerX - drawWidth * config.vanishingPoint.x,
    y: camera.horizonY - drawHeight * config.vanishingPoint.y, width: drawWidth, height: drawHeight };
}
