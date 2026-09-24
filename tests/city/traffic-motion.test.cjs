const assert = require('node:assert/strict');
const { test } = require('node:test');
const { makeTrafficPlan, objectsForPlan, routeTarget } = require('../../.qa/geometry/gameplay/patterns.js');
const { obstacleLateralAt, obstacleSpeed, trafficSignal, trafficTrajectoriesClear } = require('../../.qa/geometry/gameplay/trafficMotion.js');
const { createRun, advanceGame } = require('../../.qa/geometry/gameplay/engine.js');
const { trafficMotion } = require('../../.qa/geometry/config/trafficMotion.js');
const { gameplay, objectVisuals } = require('../../.qa/geometry/config/gameplay.js');
const { createSceneLayout, projectWorld } = require('../../.qa/geometry/geometry/perspective.js');
const { objectProjection } = require('../../.qa/geometry/geometry/entities.js');
const { projectEntities } = require('../../.qa/geometry/geometry/worldEntities.js');
const { advanceClock } = require('../../.qa/geometry/motion/simulation.js');
const close = (a, b, epsilon = 1e-7) => assert.ok(Math.abs(a - b) < epsilon, `${a} != ${b}`);

test('traffic changes adjacent lanes with advance warning, clearance and bounded density', () => {
  const directions = new Set(), speeds = new Set(), rows = new Set();
  let changes = 0, blocks = 0;
  for (const round of [0, 2, 5, 9]) for (let seed = 1; seed <= 100; seed++) {
    const plan = makeTrafficPlan(seed * 7919, 0, round, null);
    const windows = [];
    for (const [index, row] of plan.encounters.entries()) for (const car of row.obstacles) {
      if (car.kind === 'barrier') { assert.equal(obstacleSpeed(car), 0); assert.equal(car.maneuver, undefined); continue; }
      speeds.add(obstacleSpeed(car));
      assert.ok(obstacleSpeed(car) > 0 && obstacleSpeed(car) < plan.cruiseSpeed);
      if (!car.maneuver) continue;
      const m = car.maneuver;
      assert.equal(Math.abs(car.lane - m.from), 1);
      assert.ok(m.start >= trafficMotion.signalSeconds);
      const contact = row.time - (gameplay.playerFront + objectVisuals.traffic.rear) / (plan.cruiseSpeed - obstacleSpeed(car));
      assert.ok(contact - m.start - m.duration >= trafficMotion.settledBeforeContactSeconds - 1e-8);
      windows.push([m.start - trafficMotion.signalSeconds, m.start + m.duration]);
      rows.add(index); directions.add(car.lane - m.from); changes++;
    }
    windows.sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < windows.length; i++) assert.ok(windows[i][0] - windows[i - 1][1] >= trafficMotion.betweenManeuversSeconds - 1e-8);
    assert.ok(windows.length <= (round < 3 ? 2 : 3));
    blocks++;
  }
  assert.ok(changes >= blocks * 1.7, 'moving traffic must be frequent enough to actually be visible');
  assert.deepEqual([...directions].sort(), [-1, 1]);
  assert.ok(rows.size >= 5 && speeds.size >= 3);
});

test('vehicles never overlap each other or barriers along their generated trajectories', () => {
  // Independent geometric sampling, not the planner's own trajectory validator.
  for (const round of [0, 3, 8]) for (let seed = 1; seed <= 45; seed++) {
    const plan = makeTrafficPlan(seed * 13171, 0, round, null);
    const objects = objectsForPlan(plan, 0, 1);
    for (let time = 0; time < plan.duration - gameplay.slowdownSeconds; time += 1 / 60) {
      for (let i = 0; i < objects.length; i++) for (let j = i + 1; j < objects.length; j++) {
        const a = objects[i], b = objects[j], ba = objectVisuals[a.kind], bb = objectVisuals[b.kind];
        const za = a.position + a.speed * time - plan.cruiseSpeed * time;
        const zb = b.position + b.speed * time - plan.cruiseSpeed * time;
        if (za < -gameplay.playerRear - ba.front || zb < -gameplay.playerRear - bb.front) continue;
        const dz = za - zb, dx = Math.abs(obstacleLateralAt(a, time) - obstacleLateralAt(b, time));
        assert.ok(dx >= (ba.visibleWidth + bb.visibleWidth) / 2 || dz < -ba.front - bb.rear || dz > ba.rear + bb.front,
          `overlapping ${i}/${j}, seed ${seed}, round ${round}, t ${time}`);
      }
    }
  }
});

test('trajectory validator rejects swapping through another vehicle and crossing a barrier', () => {
  const car = (lane, from) => ({ kind: 'traffic', lane, speed: .3, maneuver: { from, start: 1, duration: 1 } });
  assert.equal(trafficTrajectoriesClear([{ time: 3, obstacles: [car(0, -1), car(-1, 0)] }], 1.8), false);
  assert.equal(trafficTrajectoriesClear([{ time: 3, obstacles: [car(0, 1), { kind: 'barrier', lane: 0 }] }], 1.8), false);
  assert.equal(trafficTrajectoriesClear([{ time: 3, obstacles: [car(0, -1), { kind: 'barrier', lane: 1 }] }], 1.8), true);
});

test('lane changes ease in and out, stay within the road and signal only the intended side', () => {
  for (const [from, lane] of [[-1, 0], [0, -1], [0, 1], [1, 0]]) {
    const car = { kind: 'traffic', lane, maneuver: { from, start: 1, duration: trafficMotion.changeSeconds } };
    assert.equal(obstacleLateralAt(car, 0), from);
    assert.equal(trafficSignal(car, 1 - trafficMotion.signalSeconds - .001), 0);
    assert.equal(Math.sign(trafficSignal(car, .6)), Math.sign(lane - from));
    const end = 1 + car.maneuver.duration;
    close(obstacleLateralAt(car, 1 + car.maneuver.duration / 2), (from + lane) / 2);
    assert.ok(Math.abs(obstacleLateralAt(car, 1.001) - from) < .00001);
    assert.ok(Math.abs(obstacleLateralAt(car, end - .001) - lane) < .00001);
    close(obstacleLateralAt(car, end), lane);
    assert.equal(trafficSignal(car, end), 0);
    for (let t = 0; t <= 3; t += .01) assert.ok(Math.abs(obstacleLateralAt(car, t)) <= 1);
  }
});

test('collision follows the moving body instead of the eventual lane; one contact costs one life', () => {
  const initial = createRun(81);
  const object = { id: 101, kind: 'traffic', lane: 1, position: .15, speed: 0, contacted: false,
    maneuver: { from: 0, start: 1, duration: .78 }, lateral: 0 };
  let vacant = { ...initial, lateral: 1, coins: [], objects: [object] };
  vacant = advanceGame(vacant, .1, 1);
  assert.equal(vacant.crashes, 0, 'the destination cannot collide before the car is there');
  let actual = { ...initial, lateral: 0, coins: [], objects: [object] };
  actual = advanceGame(actual, .1, 0);
  assert.equal(actual.crashes, 1); assert.equal(actual.lives, 2);
  actual = advanceGame(actual, .2, 0);
  assert.equal(actual.crashes, 1);
  const crossing = { ...object, position: 1.8, maneuver: { from: -1, start: 0, duration: 1.8 } };
  let state = { ...initial, coins: [], objects: [crossing] };
  for (let frame = 0; frame < 65; frame++) state = advanceGame(state, 1 / 60, 0);
  assert.equal(state.crashes, 1, 'a body crossing the player must collide even if its destination is another lane');
});

test('actual traffic motion agrees at 30/60/120 Hz and shares the scene projection', () => {
  const initial = createRun(2026), layout = createSceneLayout(390, 844, { top: 59, bottom: 34, left: 0, right: 0 });
  const targetCar = initial.objects.find(o => o.maneuver);
  assert.ok(targetCar);
  const duration = Math.floor((targetCar.maneuver.start + targetCar.maneuver.duration / 2) * 30) / 30;
  const runs = [30, 60, 120].map(hz => {
    let state = initial;
    for (let frame = 0; frame < Math.round(duration * hz); frame++) state = advanceGame(state, 1 / hz, routeTarget(state.plan, 0, state.phaseTime));
    return state;
  });
  for (const state of runs) {
    assert.equal(state.crashes, 0);
    const car = state.objects.find(o => o.id === targetCar.id), first = runs[0].objects.find(o => o.id === targetCar.id);
    assert.ok(car.lateral !== car.lane && car.lateral !== car.maneuver.from);
    close(car.lateral, first.lateral); close(car.position, first.position);
    const p = objectProjection(layout, car, state.distance);
    const foot = projectWorld(layout.camera, { lateral: car.lateral, distance: layout.playerDepth + car.position - state.distance });
    close(p.foot.x, foot.x); close(p.foot.y, foot.y);
    const projected = projectEntities(layout, state).find(o => o.id === car.id);
    close(projected.signal, trafficSignal(car, state.phaseTime));
    assert.equal(projected.appearance, car.appearance);
  }
});

test('pause, background return, game over and restart preserve the traffic clock correctly', () => {
  let state = createRun(2026);
  const car = state.objects.find(o => o.maneuver);
  while (state.phaseTime < car.maneuver.start + .2) state = advanceGame(state, 1 / 120, routeTarget(state.plan, 0, state.phaseTime));
  const paused = state;
  let clock = advanceClock(1000, 1016, false);
  state = advanceGame(state, clock.seconds, 0); assert.strictEqual(state, paused);
  clock = advanceClock(clock.timestamp, 600000, true);
  state = advanceGame(state, clock.seconds, 0); assert.strictEqual(state, paused);
  clock = advanceClock(clock.timestamp, 900000, true);
  state = advanceGame(state, clock.seconds, 0); assert.strictEqual(state, paused);
  clock = advanceClock(clock.timestamp, 900016, true);
  state = advanceGame(state, clock.seconds, 0);
  close(state.phaseTime - paused.phaseTime, .016);
  const stopped = { ...state, phase: 'gameOver' };
  assert.strictEqual(advanceGame(stopped, .2, 1), stopped);
  const restarted = createRun(2026, 2);
  assert.equal(restarted.phaseTime, 0);
  for (const object of restarted.objects) close(object.lateral, object.maneuver?.from ?? object.lane);
});
