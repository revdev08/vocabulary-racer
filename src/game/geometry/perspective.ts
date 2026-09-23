import { scene } from '../config/visual';

export type Point = { x: number; y: number };
export type Box = { x: number; y: number; width: number; height: number };
export type Insets = { top: number; right: number; bottom: number; left: number };
export type Camera = {
  centerX: number;
  horizonY: number;
  groundHeight: number;
  nearLaneWidth: number;
};
export type WorldPosition = { lateral: number; distance: number; elevation?: number };

export function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.max(min, Math.min(value, max));
}

/** Lane-width units, z > 0. The road clips at 1; scenery exits beyond the sides. */
export function project(camera: Camera, x: number, z: number, elevation = 0): Point {
  'worklet';
  return {
    x: camera.centerX + (x * camera.nearLaneWidth) / z,
    y: camera.horizonY + (camera.groundHeight - elevation * camera.nearLaneWidth) / z,
  };
}

/** Public world coordinates for the player and future road objects. */
export function projectWorld(camera: Camera, position: WorldPosition): Point {
  'worklet';
  return project(camera, position.lateral, position.distance, position.elevation ?? 0);
}

export function depthAtY(camera: Camera, y: number) {
  'worklet';
  return camera.groundHeight / Math.max(0.001, y - camera.horizonY);
}

export function unproject(camera: Camera, point: Point): WorldPosition {
  'worklet';
  const distance = depthAtY(camera, point.y);
  return { lateral: (point.x - camera.centerX) * distance / camera.nearLaneWidth, distance };
}

/** Inverse projection onto a vertical wall parallel to the street. */
export function unprojectWall(camera: Camera, point: Point, lateral: number) {
  'worklet';
  const distance = lateral * camera.nearLaneWidth / (point.x - camera.centerX);
  const elevation = (camera.groundHeight - (point.y - camera.horizonY) * distance) / camera.nearLaneWidth;
  return { lateral, distance, elevation };
}

// GPU counterpart of unproject(), owned here rather than duplicated by shaders.
export const GROUND_PROJECTION_SKSL = `
  uniform float centerX;
  uniform float horizon;
  uniform float groundHeight;
  uniform float laneWidth;
  float2 groundPosition(float2 screen) {
    float distance = groundHeight / max(screen.y - horizon, 0.001);
    return float2((screen.x - centerX) * distance / laneWidth, distance);
  }
  // Same inverse as unprojectWall(): returns (distance, elevation).
  float2 wallPosition(float2 screen, float lateral) {
    float distance = lateral * laneWidth / (screen.x - centerX);
    return float2(distance, (groundHeight - (screen.y - horizon) * distance) / laneWidth);
  }
`;

export function groundQuad(camera: Camera, left: number, right: number, far: number, near: number) {
  'worklet';
  return [project(camera, left, far), project(camera, right, far),
    project(camera, right, near), project(camera, left, near)];
}

export function polygonPath(points: readonly Point[]) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
}

export function createSceneLayout(width: number, height: number, insets: Insets, pixelRatio = 1) {
  const compact = height < 700;
  const hudTop = insets.top + 12;
  const hudLeft = Math.max(16, insets.left + 12);
  const hudRight = Math.max(16, insets.right + 12);
  const promptWidth = Math.min(width - hudLeft - hudRight, clamp(width * 0.68, 224, 300));
  const prompt: Box = {
    x: (width - promptWidth) / 2,
    y: hudTop + 86,
    width: promptWidth,
    height: compact ? 100 : 108,
  };
  const horizonY = Math.max(height * 0.37, prompt.y + prompt.height + 24);
  const groundHeight = height - horizonY;
  const playerBaseY = height - insets.bottom - Math.max(48, height * 0.095);
  const playerDepth = groundHeight / (playerBaseY - horizonY);
  const camera: Camera = {
    centerX: width / 2,
    horizonY,
    groundHeight,
    // All three lanes now fit at the player's ground contact, not only at the gates.
    nearLaneWidth: (width * 0.92 / scene.laneCount) * playerDepth,
  };
  const playerSize = Math.min(
    width * scene.player.maxWidthFraction,
    camera.nearLaneWidth / playerDepth * scene.player.visibleLaneWidth / (scene.player.contentRight - scene.player.contentLeft),
    // Never upscale the bitmap above one source pixel per physical screen pixel.
    scene.player.sourceSize / Math.max(1, pixelRatio),
  );
  const player: Box = {
    x: (width - playerSize) / 2,
    y: playerBaseY - playerSize * scene.player.contentBottom,
    width: playerSize,
    height: playerSize,
  };

  return { width, height, compact, hudTop, hudLeft, hudRight, prompt, camera,
    player, playerBaseY, playerDepth };
}

export type SceneLayout = ReturnType<typeof createSceneLayout>;
