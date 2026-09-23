const assert = require('node:assert/strict');
const { test } = require('node:test');
const { advanceClock, advanceLateral, changeLane, swipeDirection, roadSegment } = require('../../.qa/geometry/motion/simulation.js');
const { createSceneLayout, projectWorld, unproject, groundQuad } = require('../../.qa/geometry/geometry/perspective.js');
const { driving } = require('../../.qa/geometry/config/driving.js');

const close = (a, b, epsilon = 1e-8) => assert.ok(Math.abs(a - b) <= epsilon, `${a} differs from ${b}`);
const layout = createSceneLayout(390, 844, { top: 59, bottom: 34, left: 0, right: 0 }, 3);

test('consecutive lane intents use the destination, including reversals and bounds', () => {
  let target = 0;
  const visited = [-1, -1, 1, 1, 1, -1, -1, -1].map(direction => target = changeLane(target, direction));
  assert.deepEqual(visited, [-1, -1, 0, 1, 1, 0, -1, -1]);
  let x = advanceLateral(0, -1, 0.08);
  assert.ok(x > -1 && x < 0);
  x = advanceLateral(x, 0, 0.06);
  const before = x;
  x = advanceLateral(x, 1, 0.06);
  assert.ok(x > before && x < 1);
  for (let i = 0; i < 60; i++) x = advanceLateral(x, 1, 1 / 60);
  assert.equal(x, 1);
});

test('short touches, vertical drags and ambiguous diagonals do not change lanes', () => {
  assert.equal(swipeDirection(-23, 0), 0);
  assert.equal(swipeDirection(4, 150), 0);
  assert.equal(swipeDirection(40, 40), 0);
  assert.equal(swipeDirection(-24, 3), -1);
  assert.equal(swipeDirection(100, 10), 1);
});

test('distance and lateral interpolation agree at 30, 60 and 120 Hz', () => {
  const runs = [30, 60, 120].map(hz => {
    let timestamp = null, distance = 0, x = 0;
    for (let i = 0; i <= hz; i++) {
      const clock = advanceClock(timestamp, i * 1000 / hz, true);
      timestamp = clock.timestamp;
      distance += driving.speed * clock.seconds;
      x = advanceLateral(x, 1, clock.seconds);
    }
    return { distance, x };
  });
  for (const run of runs) { close(run.distance, driving.speed); close(run.x, 1); }
  let x30 = 0, x120 = 0;
  for (let i = 0; i < 3; i++) x30 = advanceLateral(x30, -1, 1 / 30);
  for (let i = 0; i < 12; i++) x120 = advanceLateral(x120, -1, 1 / 120);
  close(x30, x120);
});

test('pause freezes both distance and an in-progress lane transition', () => {
  let clock = advanceClock(null, 100, true);
  clock = advanceClock(clock.timestamp, 116, true);
  const x = advanceLateral(0, 1, clock.seconds);
  clock = advanceClock(clock.timestamp, 132, false);
  assert.equal(clock.seconds, 0);
  assert.equal(clock.timestamp, null);
  assert.equal(advanceLateral(x, 1, clock.seconds), x);
  clock = advanceClock(clock.timestamp, 60132, true);
  assert.equal(clock.seconds, 0);
  clock = advanceClock(clock.timestamp, 60148, true);
  close(clock.seconds, 0.016);
});

test('return from background and stalled frames never catch up elapsed wall time', () => {
  const stopped = advanceClock(1234, 1240, false);
  const resumed = advanceClock(stopped.timestamp, 3600000, true);
  assert.equal(resumed.seconds, 0);
  assert.equal(advanceClock(1200, 90000, true).seconds, 0);
  assert.equal(advanceClock(500, 400, true).seconds, 0);
  close(advanceClock(resumed.timestamp, 3600016, true).seconds, 0.016);
});

test('project/unproject round-trip world coordinates on all three lanes', () => {
  for (const lateral of [-1.5, -1, -0.5, 0, 0.5, 1, 1.5]) {
    for (const distance of [1, 1.4, 3, 12, 50]) {
      const point = projectWorld(layout.camera, { lateral, distance });
      const world = unproject(layout.camera, point);
      close(world.lateral, lateral);
      close(world.distance, distance);
    }
  }
});

test('all player lane positions fit on screen without changing sprite aspect or height', () => {
  for (const [width, height, top, bottom] of [[320,568,20,16],[390,844,59,34],[540,1024,24,20]]) {
    const l = createSceneLayout(width,height,{top,bottom,left:0,right:0},3);
    for (const lateral of [-1, 0, 1]) {
      const point = projectWorld(l.camera,{lateral,distance:l.playerDepth});
      assert.ok(point.x - l.player.width / 2 >= 0);
      assert.ok(point.x + l.player.width / 2 <= width);
      close(point.y,l.playerBaseY);
      close(l.player.width,l.player.height);
      const laneHalfWidth = l.camera.nearLaneWidth / l.playerDepth / 2;
      assert.ok(l.player.width / 2 < laneHalfWidth);
    }
  }
});

test('segments approach, grow and clip at the screen edge with no missing road', () => {
  const camera = layout.camera;
  const a = roadSegment(3,0), b = roadSegment(3,0.1);
  const before = groundQuad(camera,-0.514,-0.486,a.dashFar,a.near);
  const after = groundQuad(camera,-0.514,-0.486,b.dashFar,b.near);
  assert.ok(after[2].y > before[2].y);
  assert.ok(after[2].x - after[3].x > before[2].x - before[3].x);
  assert.ok(after[2].y - after[0].y > before[2].y - before[0].y);
  for (const distance of [0,0.1,0.39,0.4,0.8,0.86,2000]) {
    let previousFar = driving.road.nearClip;
    for (let i=0;i<driving.road.segmentCount;i++) {
      const segment = roadSegment(i,distance);
      if(segment.far <= segment.near) continue;
      close(segment.near,previousFar);
      previousFar=segment.far;
      assert.ok(segment.near >= driving.road.nearClip);
    }
  }
  assert.ok(roadSegment(0,0.6).dashFar < driving.road.nearClip);
});

test('recycling a segment does not jump the visible pattern or the horizon', () => {
  const stride = driving.road.segmentLength;
  for(let i=1;i<30;i++) {
    const before=roadSegment(i,stride-1e-9), after=roadSegment(i-1,stride+1e-9);
    close(before.near,after.near,3e-9);
    close(before.far,after.far,3e-9);
  }
  const originalCamera = {...layout.camera};
  for(const travelled of [0,100,100000]) {
    roadSegment(2,travelled);
    const distant=projectWorld(layout.camera,{lateral:1,distance:1e12});
    close(distant.x,layout.camera.centerX,1e-6);
    close(distant.y,layout.camera.horizonY,1e-6);
  }
  assert.deepEqual(layout.camera,originalCamera);
});
