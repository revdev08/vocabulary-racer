const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRun, advanceGame } = require('../../.qa/geometry/gameplay/engine.js');
const { routeTarget } = require('../../.qa/geometry/gameplay/patterns.js');
function question() {
  let run = createRun(183, 1, 'greetings');
  for (let i = 0; i < 2000 && run.phase === 'traffic'; i++) {
    run = advanceGame(run, 1/60, routeTarget(run.plan, run.plan.initialLateral, run.phaseTime));
  }
  assert.equal(run.phase, 'question');
  return run;
}
test('holding accelerates question movement by 8 without skipping its answer', () => {
  const initial = question();
  const normal = advanceGame(initial, 1/60, 0);
  const fast = advanceGame(initial, 1/60, 0, true);
  assert.ok(Math.abs((fast.phaseTime-initial.phaseTime)/(normal.phaseTime-initial.phaseTime)-8)<.001);
  assert.ok(fast.distance > normal.distance);
  let run = initial, frames = 0;
  while (run.phase === 'question' && frames++ < 1000) run = advanceGame(run, 1/60, initial.question.correctLane, true);
  assert.ok(frames <= 32, 'a full four-second question should resolve in about half a second at 8x');
  assert.equal(run.correct, initial.correct + 1);
  assert.equal(run.errors, initial.errors);
  assert.equal(run.phase, 'feedback');
  assert.deepEqual(advanceGame(run,1/60,0,true),advanceGame(run,1/60,0,false));
});
test('holding never accelerates traffic, and releasing restores normal question time', () => {
  const traffic = createRun(183);
  assert.deepEqual(advanceGame(traffic,1/60,0,true),advanceGame(traffic,1/60,0,false));
  const fast = advanceGame(question(),1/60,0,true);
  const released = advanceGame(fast,1/60,0,false);
  assert.ok(Math.abs(released.phaseTime-fast.phaseTime-1/60)<.00001);
});
