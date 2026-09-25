import { gameplay, objectVisuals } from '../config/gameplay';
import { driving } from '../config/driving';
import { trafficMotion } from '../config/trafficMotion';
import { advanceLateral, type Lane } from '../motion/simulation';
import { sweptContact } from './collision';
import { random } from './random';
import { trafficAppearanceOrder } from './trafficAppearance';
import { obstacleLateralAt, obstacleSpeed, trafficTrajectoriesClear } from './trafficMotion';
import type { Encounter, PatternId, TrafficPlan, WorldObject } from './types';

export function trafficPace(completedRounds: number) {
  'worklet';
  const round = Math.max(0, Math.floor(completedRounds));
  const cruiseSpeed = Math.min(gameplay.maximumTrafficSpeed, driving.speed + round * gameplay.speedIncreasePerRound);
  const encounterGap = Math.max(gameplay.minimumEncounterGapSeconds, gameplay.encounterGapSeconds - round * gameplay.gapReductionPerRound);
  const paceLevel = Math.min(round, Math.ceil((gameplay.maximumTrafficSpeed - driving.speed) / gameplay.speedIncreasePerRound)) + 1;
  return { cruiseSpeed, encounterGap, paceLevel };
}

export function turnTarget(from: number, to: Lane, sinceStart: number): Lane {
  'worklet';
  const start = Math.round(from) as Lane;
  if (sinceStart < 0) return start;
  if (Math.abs(to - start) > 1 && sinceStart < gameplay.gestureRepeatSeconds) return 0;
  return to;
}

/** A maneuver starts after physical rear clearance plus a human reaction allowance. */
export function maneuverStart(encounters: Encounter[], rowIndex: number, cruiseSpeed: number) {
  'worklet';
  if (rowIndex === 0) return gameplay.reactionSeconds;
  const previous = encounters[rowIndex - 1];
  let clearance = 0;
  for (const object of previous.obstacles) {
    const relativeSpeed = cruiseSpeed - obstacleSpeed(object);
    clearance = Math.max(clearance, (gameplay.playerRear + objectVisuals[object.kind].front) / relativeSpeed);
  }
  return previous.time + clearance + gameplay.maneuverClearanceSeconds + gameplay.reactionSeconds;
}

/** Shared by the route validator, coin route and deterministic driving checks. */
export function routeTarget(plan: TrafficPlan, from: number, time: number): Lane {
  'worklet';
  let prior = from;
  for (let i = 0; i < plan.route.length; i++) {
    const start = maneuverStart(plan.encounters, i, plan.cruiseSpeed);
    if (time < start) return Math.round(prior) as Lane;
    if (time <= plan.encounters[i].time) return turnTarget(prior, plan.route[i], time - start);
    prior = plan.route[i];
  }
  return Math.round(prior) as Lane;
}

export function objectsForPlan(plan: TrafficPlan, distance: number, firstId: number): WorldObject[] {
  'worklet';
  const objects: WorldObject[] = [];
  const appearances = trafficAppearanceOrder(plan.seed, firstId);
  let trafficIndex = 0;
  for (const row of plan.encounters) for (const item of row.obstacles) {
    const speed = obstacleSpeed(item);
    objects.push({ ...item, ...(item.kind === 'traffic' ? { appearance: appearances[trafficIndex++ % appearances.length] } : {}),
      id: firstId + objects.length, speed, lateral: obstacleLateralAt(item, 0),
      position: distance + (plan.cruiseSpeed - speed) * row.time, contacted: false });
  }
  return objects;
}

/** Dynamic programming over reachable lanes; every edge is swept against ALL obstacles. */
export function validateRoute(encounters: Encounter[], initial: number, forcedFirst?: Lane, cruiseSpeed: number = driving.speed): Lane[] | null {
  'worklet';
  let states = [{ lateral: initial, route: [] as Lane[], cost: 0 }];
  for (let rowIndex = 0; rowIndex < encounters.length; rowIndex++) {
    const row = encounters[rowIndex];
    const previousTime = rowIndex === 0 ? 0 : encounters[rowIndex - 1].time;
    const nextStates: typeof states = [];
    for (const lane of [-1, 0, 1] as Lane[]) {
      if (row.obstacles.some(o => o.lane === lane) || (rowIndex === 0 && forcedFirst !== undefined && lane !== forcedFirst)) continue;
      for (const previous of states) {
        const change = Math.abs(lane - previous.lateral);
        const lead = change > 1 + gameplay.routeTolerance ? gameplay.doubleChangeLeadSeconds : gameplay.minimumEncounterGapSeconds;
        if (change > gameplay.routeTolerance && row.time - previousTime < lead - 1e-6) continue;
        let lateral = previous.lateral, safe = true;
        const start = maneuverStart(encounters, rowIndex, cruiseSpeed);
        for (let t = previousTime; t < row.time - 1e-8 && safe;) {
          const dt = Math.min(gameplay.routeStepSeconds, row.time - t);
          const target = turnTarget(previous.lateral, lane, t - start);
          const next = advanceLateral(lateral, target, dt);
          for (const other of encounters) for (const object of other.obstacles) {
            const speed = cruiseSpeed - obstacleSpeed(object);
            const b = objectVisuals[object.kind];
            if (sweptContact(lateral - obstacleLateralAt(object, t), next - obstacleLateralAt(object, t + dt), (t - other.time) * speed,
              (t + dt - other.time) * speed, gameplay.playerHalfWidth + b.halfWidth,
              gameplay.playerFront + b.rear, gameplay.playerRear + b.front)) safe = false;
          }
          lateral = next; t += dt;
        }
        if (safe && Math.abs(lateral - lane) < gameplay.routeTolerance) {
          const candidate = { lateral, route: [...previous.route, lane], cost: previous.cost + change };
          const existing = nextStates.findIndex(s => s.route[rowIndex] === lane);
          if (existing < 0) nextStates.push(candidate);
          else if (nextStates[existing].cost > candidate.cost) nextStates[existing] = candidate;
        }
      }
    }
    if (!nextStates.length) return null;
    states = nextStates;
  }
  states.sort((a, b) => a.cost - b.cost);
  return states[0]?.route ?? null;
}

/** Enrich a proven corridor, retaining its arrival rhythm. Invalid maneuvers are simply omitted. */
function animateTraffic(encounters: Encounter[], initial: number, cruiseSpeed: number, rounds: number, seed: number,
  originalRoute: Lane[]) {
  'worklet';
  let moving = encounters.map(row => ({ ...row, obstacles: row.obstacles.map(object => {
    if (object.kind !== 'traffic') return object;
    const r = random(seed); seed = r.seed;
    return { ...object, speed: trafficMotion.speeds[Math.floor(r.value * trafficMotion.speeds.length)] };
  }) }));
  let route = trafficTrajectoriesClear(moving, cruiseSpeed) ? validateRoute(moving, initial, undefined, cruiseSpeed) : null;
  if (!route) { moving = encounters; route = originalRoute; }
  const maximum = rounds >= trafficMotion.advancedAfterRounds ? trafficMotion.advancedChanges : trafficMotion.beginnerChanges;
  const windows: { start: number; end: number }[] = [];
  const first = random(seed); seed = first.seed;
  // Alternate the order of attempts so the same row/car is not always the one that changes lanes.
  const offset = Math.floor(first.value * moving.length);
  for (let index = 0; index < moving.length && windows.length < maximum; index++) {
    const rowIndex = (index + offset) % moving.length;
    const row = moving[rowIndex];
    const carIndex = row.obstacles.findIndex(object => object.kind === 'traffic');
    if (carIndex < 0) continue;
    const car = row.obstacles[carIndex];
    const contactLead = (gameplay.playerFront + objectVisuals.traffic.rear) / (cruiseSpeed - obstacleSpeed(car));
    const end = row.time - contactLead - trafficMotion.settledBeforeContactSeconds;
    const start = end - trafficMotion.changeSeconds;
    const warning = start - trafficMotion.signalSeconds;
    if (warning < 0 || windows.some(w => warning < w.end + trafficMotion.betweenManeuversSeconds
      && end + trafficMotion.betweenManeuversSeconds > w.start)) continue;
    const r = random(seed); seed = r.seed;
    const neighbors = (r.value < .5 ? [-1, 0, 1] : [1, 0, -1]) as Lane[];
    for (const from of neighbors) {
      if (Math.abs(from - car.lane) !== 1) continue;
      const candidate = moving.map((item, i) => i !== rowIndex ? item : { ...item,
        obstacles: item.obstacles.map((object, j) => j !== carIndex ? object : { ...object,
          maneuver: { from, start, duration: trafficMotion.changeSeconds } }) });
      if (!trafficTrajectoriesClear(candidate, cruiseSpeed)) continue;
      const safeRoute = validateRoute(candidate, initial, undefined, cruiseSpeed);
      if (!safeRoute) continue;
      moving = candidate; route = safeRoute; windows.push({ start: warning, end });
      break;
    }
  }
  return { encounters: moving, route };
}

/** Seeded lane variations and short bursts prevent a fixed left/right metronome. */
function buildEncounters(pattern: PatternId, side: Lane, count: number, seed: number,
  firstTime: number, gap: number, previousLane?: Lane, bursts = false, crossovers = false) {
  'worklet';
  const freeLanes: Lane[] = [pattern === 'stagger' ? 0 : side];
  let lastSide = side;
  for (let i = 1; i < count; i++) {
    const r = random(seed); seed = r.seed;
    const prior = freeLanes[i - 1];
    let next: Lane;
    if (prior === 0) {
      const preferred = pattern === 'coinDetour' ? lastSide : -lastSide as Lane;
      next = (r.value < .7 ? preferred : -preferred) as Lane;
    } else {
      const double = crossovers && ((pattern === 'double' && i === 1) || (i > 1 && r.value < .22));
      next = double ? -prior as Lane : 0;
    }
    freeLanes.push(next);
    if (next !== 0) lastSide = next;
  }
  const encounters: Encounter[] = [];
  let time = firstTime;
  for (let i = 0; i < count; i++) {
    const free = freeLanes[i];
    let r = random(seed); seed = r.seed;
    let occupied = ([-1, 0, 1] as Lane[]).filter(lane => lane !== free);
    if (i === 0 && pattern !== 'double') {
      const openings = occupied.filter(lane => lane !== previousLane);
      occupied = [openings[Math.floor(r.value * openings.length)]];
    }
    const trafficFirst = r.value < 0.5;
    const obstacles: Encounter['obstacles'] = occupied.map((lane, index) => ({ lane,
      kind: (index === 0) === trafficFirst ? 'traffic' : 'barrier' }));
    encounters.push({ time, obstacles });
    r = random(seed); seed = r.seed;
    const nextFree = freeLanes[i + 1];
    // Opposite extremes need two gestures, even at the highest rhythm.
    const rhythm = !bursts ? 1 : i % 3 === 2 ? gameplay.recoveryGapFactor : gameplay.burstGapFactor;
    time += Math.max(gameplay.minimumEncounterGapSeconds, gap * rhythm,
      Math.abs(nextFree - free) === 2 ? gameplay.doubleChangeLeadSeconds : 0)
      + r.value * gameplay.encounterJitterSeconds;
  }
  return { encounters, seed };
}

export function makeTrafficPlan(seed: number, initial: number, completedRounds: number, previous: PatternId | null,
  previousPlan?: TrafficPlan): TrafficPlan {
  'worklet';
  const pace = trafficPace(completedRounds);
  const round = Math.max(0, Math.floor(completedRounds));
  const count = round === 0 ? gameplay.firstRoundEncounters
    : Math.min(gameplay.advancedEncounters, gameplay.simpleEncounters + round - 1);
  const choices: PatternId[] = ['sweep', 'stagger', 'coinDetour'];
  if (completedRounds >= gameplay.roundsForCrossovers) choices.push('double');
  const available = choices.filter(p => p !== previous);
  let r = random(seed); seed = r.seed;
  const pattern = available[Math.floor(r.value * available.length)];
  const previousLane = previousPlan?.encounters[0]?.obstacles[0]?.lane;
  for (let attempt = 0; attempt <= gameplay.plannerAttempts; attempt++) {
    r = random(seed); seed = r.seed;
    const side = (pattern === 'double' && previousLane === -1 ? -1
      : pattern === 'double' && previousLane === 0 ? 1 : r.value < 0.5 ? -1 : 1) as Lane;
    const relaxed = attempt === gameplay.plannerAttempts;
    const gap = relaxed ? gameplay.fallbackGapSeconds : pace.encounterGap;
    const built = buildEncounters(pattern, side, count, seed,
      gameplay.firstEncounterSeconds + (completedRounds < 2 ? gameplay.beginnerExtraSeconds : 0), gap, previousLane,
      !relaxed && completedRounds >= gameplay.roundsForBursts, completedRounds >= gameplay.roundsForCrossovers);
    seed = built.seed;
    const { encounters } = built;
    const route = validateRoute(encounters, initial, undefined, pace.cruiseSpeed);
    if (route) return { pattern, ...animateTraffic(encounters, initial, pace.cruiseSpeed, completedRounds, seed, route),
      seed, initialLateral: initial, ...pace,
      duration: encounters[count - 1].time + gameplay.clearAfterEncounterSeconds + gameplay.slowdownSeconds };
  }
  // A deterministic adjacent-lane corridor with extra clearance, never a stationary safe lane.
  const built = buildEncounters('sweep', -1, count, seed, gameplay.firstEncounterSeconds + gameplay.beginnerExtraSeconds,
    gameplay.fallbackGapSeconds, previousLane);
  const route = validateRoute(built.encounters, initial, undefined, pace.cruiseSpeed)!;
  return { pattern, encounters: built.encounters, route, seed: built.seed, initialLateral: initial, ...pace,
    duration: built.encounters[count - 1].time + gameplay.clearAfterEncounterSeconds + gameplay.slowdownSeconds };
}
/** Smooth speed changes without affecting the four-second decision timer. */
export function phaseSpeed(phase: string, time: number, duration: number, cruiseSpeed: number = driving.speed,
  confirmationSeconds: number = gameplay.feedbackSeconds) {
  'worklet';
  if (phase === 'question') return gameplay.decisionSpeed;
  const t = phase === 'traffic' ? Math.max(0, Math.min(1, (time - duration + gameplay.slowdownSeconds) / gameplay.slowdownSeconds))
    : Math.max(0, Math.min(1, time / confirmationSeconds));
  const eased = t * t * (3 - 2 * t);
  return phase === 'traffic' ? cruiseSpeed + (gameplay.decisionSpeed - cruiseSpeed) * eased
    : gameplay.decisionSpeed + (cruiseSpeed - gameplay.decisionSpeed) * eased;
}
