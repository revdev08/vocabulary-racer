import { playerAnimation } from '../config/playerAnimation';
import { scene } from '../config/visual';
import type { SceneLayout } from './perspective';

export type PlayerPose = keyof typeof playerAnimation.frames;

/** Translate the source registration only; keep square pixels and the approved scale. */
export function playerFrameRect(layout: SceneLayout, pose: PlayerPose) {
  const anchor = playerAnimation.frames[pose];
  const reference = playerAnimation.frames.straight;
  const scale = layout.player.width / scene.player.sourceSize;
  return { ...layout.player,
    x: layout.player.x + (reference.centerX - anchor.centerX) * scale,
    y: layout.player.y + (reference.baseY - anchor.baseY) * scale };
}

// Blend premultiplied pixels in one draw. Layering two translucent Images with
// source-over would make the body see-through halfway through the transition.
export const PLAYER_TURN_SKSL = `
  uniform shader straight;
  uniform shader left;
  uniform shader right;
  uniform float turn;

  half4 main(float2 xy) {
    float amount = clamp(abs(turn), 0.0, 1.0);
    if (amount < 0.001) return straight.eval(xy);
    half4 pose = turn < 0.0 ? left.eval(xy) : right.eval(xy);
    if (amount > 0.999) return pose;
    return mix(straight.eval(xy), pose, amount);
  }
`;
