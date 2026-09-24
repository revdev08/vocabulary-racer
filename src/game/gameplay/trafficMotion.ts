import { gameplay, objectVisuals } from '../config/gameplay';
import { trafficMotion } from '../config/trafficMotion';
import { sweptContact } from './collision';
import type { Encounter, EncounterObject } from './types';

export function obstacleSpeed(object: EncounterObject) {
  'worklet';
  return object.kind === 'traffic' ? object.speed ?? gameplay.trafficCarSpeed : 0;
}

/** Shared continuous world coordinate for planning, rendering and swept collisions. */
export function obstacleLateralAt(object: EncounterObject, time: number) {
  'worklet';
  const turn = object.kind === 'traffic' ? object.maneuver : undefined;
  if (!turn) return object.lane;
  const t = Math.max(0, Math.min(1, (time - turn.start) / turn.duration));
  return turn.from + (object.lane - turn.from) * t * t * (3 - 2 * t);
}

export function trafficSignal(object: EncounterObject, time: number) {
  'worklet';
  const turn = object.kind === 'traffic' ? object.maneuver : undefined;
  if (!turn || time < turn.start - trafficMotion.signalSeconds || time >= turn.start + turn.duration) return 0;
  const age = time - turn.start + trafficMotion.signalSeconds;
  const pulse = 0.25 + 0.75 * (0.5 + 0.5 * Math.cos(age / trafficMotion.signalCycleSeconds * Math.PI * 2));
  return Math.sign(object.lane - turn.from) * pulse;
}

/** Reject cars crossing each other or passing through a barrier, including during the warning. */
export function trafficTrajectoriesClear(encounters: Encounter[], cruiseSpeed: number) {
  'worklet';
  const objects = encounters.flatMap(row => row.obstacles.map(object => ({ object, time: row.time })));
  for (let a = 0; a < objects.length; a++) for (let b = a + 1; b < objects.length; b++) {
    const first = objects[a], second = objects[b];
    const x = first.object, y = second.object;
    if (!x.maneuver && !y.maneuver && x.lane !== y.lane) continue;
    const bx = objectVisuals[x.kind], by = objectVisuals[y.kind];
    const vx = obstacleSpeed(x), vy = obstacleSpeed(y);
    const z = (cruiseSpeed - vx) * first.time - (cruiseSpeed - vy) * second.time;
    const dz = vx - vy;
    // Once either object has cleared the player it cannot obstruct an upcoming maneuver.
    let enter = 0;
    let leave = Math.min(first.time + (gameplay.playerRear + bx.front) / (cruiseSpeed - vx),
      second.time + (gameplay.playerRear + by.front) / (cruiseSpeed - vy));
    const front = bx.front + by.rear + trafficMotion.vehicleClearance;
    const rear = bx.rear + by.front + trafficMotion.vehicleClearance;
    if (Math.abs(dz) < 1e-10) {
      if (z < -front || z > rear) continue;
    } else {
      const t0 = (-front - z) / dz, t1 = (rear - z) / dz;
      enter = Math.max(enter, Math.min(t0, t1));
      leave = Math.min(leave, Math.max(t0, t1));
      if (enter > leave) continue;
    }
    // Only sample the short longitudinal overlap interval, not every pair on every frame.
    for (let t = enter; t <= leave;) {
      const end = Math.min(t + gameplay.routeStepSeconds, leave);
      if (sweptContact(obstacleLateralAt(x, t) - obstacleLateralAt(y, t),
        obstacleLateralAt(x, end) - obstacleLateralAt(y, end), z + dz * t, z + dz * end,
        (bx.visibleWidth + by.visibleWidth) / 2 + trafficMotion.vehicleClearance, front, rear)) return false;
      if (end >= leave) break;
      t = end;
    }
  }
  return true;
}
