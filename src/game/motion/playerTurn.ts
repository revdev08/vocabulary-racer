import { playerAnimation } from '../config/playerAnimation';
import { clamp } from '../geometry/perspective';

/** Visual pose only: follows actual lateral travel, never changes steering or collisions. */
export function advancePlayerTurn(current: number, from: number, to: number, seconds: number, reducedMotion = false) {
  'worklet';
  if (reducedMotion) return 0;
  if (seconds <= 0 || !Number.isFinite(seconds)) return current;
  const speed = (to - from) / seconds;
  const amount = clamp((Math.abs(speed) - playerAnimation.neutralSpeed)
    / (playerAnimation.fullTurnSpeed - playerAnimation.neutralSpeed), 0, 1);
  const desired = Math.sign(speed) * amount * amount * (3 - 2 * amount);
  const response = current * desired < 0 ? playerAnimation.reverseSeconds
    : Math.abs(desired) > Math.abs(current) ? playerAnimation.enterSeconds : playerAnimation.returnSeconds;
  const next = desired + (current - desired) * Math.exp(-seconds / response);
  return desired === 0 && Math.abs(next) < playerAnimation.snapWeight ? 0 : clamp(next, -1, 1);
}
