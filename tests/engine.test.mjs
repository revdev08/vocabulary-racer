import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRace, tick, move, APPROACH_MS, FEEDBACK_MS, WORDS } from '../src/game/engine.ts';
const rng = () => .3;
test('ten distinct words and two unambiguous choices per encounter', () => {
  let r = createRace(rng);
  assert.equal(new Set(r.deck.map(w => w.id)).size, 10);
  for (const word of WORDS) assert.notEqual(word.en, word.distractor);
  for (let i = 0; i < 10; i++) {
    assert.notEqual(r.encounter.correct, r.encounter.blocked);
    r = { ...r, lane: r.encounter.correct };
    r = tick(r, APPROACH_MS, rng);
    assert.equal(r.answers.length, i + 1);
    r = tick(r, FEEDBACK_MS, rng);
  }
  assert.equal(r.phase, 'finished'); assert.equal(r.lives, 3);
  assert.equal(r.score, 1425); // 5 x 100 + 5 x 125 + completion bonus.
  assert.equal(tick(r, 100000).score, 1425);
});
test('collision costs exactly one life and feedback cannot evaluate twice', () => {
  let r = tick(createRace(rng), APPROACH_MS, rng);
  assert.equal(r.lives, 2); assert.equal(r.answers[0].result, 'collision');
  r = tick(r, 100, rng); assert.equal(r.lives, 2); assert.equal(r.answers.length, 1);
});
test('third mistake ends race after correction, without completion reward', () => {
  let r = createRace(rng);
  for (let i = 0; i < 3; i++) { r = tick(r, APPROACH_MS, rng); assert.equal(r.phase, 'feedback'); r = tick(r, FEEDBACK_MS, rng); }
  assert.equal(r.phase, 'finished'); assert.equal(r.lives, 0); assert.equal(r.score, 0);
});
test('wrong translation is distinguished from a driving collision', () => {
  let r = createRace(rng);
  r.lane = [0, 1, 2].find(l => l !== r.encounter.correct && l !== r.encounter.blocked);
  r = tick(r, APPROACH_MS, rng);
  assert.equal(r.answers[0].result, 'wrong'); assert.equal(r.lives, 2);
});
test('obstacle stays fixed during steering; next encounter blocks arrival lane', () => {
  let r = createRace(rng); const blocked = r.encounter.blocked;
  r = move(move(move(r, -1), -1), -1);
  assert.equal(r.lane, 0); assert.equal(r.encounter.blocked, blocked);
  r = tick(r, APPROACH_MS, rng); r = move(r, 1);
  r = tick(r, FEEDBACK_MS, rng); assert.equal(r.encounter.blocked, r.lane);
  r = move(move(move(r, 1), 1), 1); assert.equal(r.lane, 2);
});
test('elapsed time only advances by supplied active time', () => {
  const r = createRace(rng); assert.equal(tick(r, 0), r);
  assert.equal(tick(r, 100).elapsed, 100); assert.equal(tick(r, -1), r);
});
