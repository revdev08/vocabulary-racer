import { driving } from '../config/driving';
import { clamp } from '../geometry/perspective';

export type Lane = -1 | 0 | 1;
export type ClockStep = { timestamp: number | null; seconds: number };

export function changeLane(lane: Lane, direction: -1 | 1): Lane {
  'worklet';
  return clamp(lane + direction, -1, 1) as Lane;
}

export function swipeDirection(dx: number, dy: number): -1 | 0 | 1 {
  'worklet';
  if (Math.abs(dx) < driving.swipeThreshold || Math.abs(dx) < Math.abs(dy) * driving.swipeDominance) return 0;
  return dx < 0 ? -1 : 1;
}

/** A stopped clock forgets its baseline. Long gaps are discarded, never caught up. */
export function advanceClock(previous: number | null, now: number, running: boolean): ClockStep {
  'worklet';
  if (!running || !Number.isFinite(now)) return { timestamp: null, seconds: 0 };
  const elapsed = previous === null ? 0 : now - previous;
  return {
    timestamp: now,
    seconds: elapsed > 0 && elapsed <= driving.maxFrameGapMs ? elapsed / 1000 : 0,
  };
}

/** Analytic exponential response: independent of refresh rate and interruptible. */
export function advanceLateral(current: number, target: Lane, seconds: number) {
  'worklet';
  if (seconds <= 0) return current;
  const next = target + (current - target) * Math.exp(-seconds / driving.laneResponseSeconds);
  return Math.abs(next - target) < driving.laneSnapDistance ? target : clamp(next, -1, 1);
}

export function positiveModulo(value: number, period: number) {
  'worklet';
  return ((value % period) + period) % period;
}

/** Stable pool of ground segments; recycling occurs beyond the far clip. */
export function roadSegment(index: number, travelled: number) {
  'worklet';
  const { nearClip, segmentLength, dashLength } = driving.road;
  const start = nearClip + index * segmentLength - positiveModulo(travelled, segmentLength);
  return {
    near: Math.max(nearClip, start),
    far: start + segmentLength,
    dashFar: start + dashLength,
  };
}
