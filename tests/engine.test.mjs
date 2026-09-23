import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRace, tick, move, APPROACH_MS, FEEDBACK_MS, WORDS, scheduleReviews } from '../src/game/engine.ts';
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

function answer(race, correct = true) {
  const lane = correct ? race.encounter.correct : [0, 1, 2].find(l => l !== race.encounter.correct && l !== race.encounter.blocked);
  return tick(tick({ ...race, lane }, APPROACH_MS, rng), FEEDBACK_MS, rng);
}
test('failed translation returns after two intervening encounters', () => {
  let r = createRace(rng); const failed = r.encounter.word.id;
  r = answer(r, false);
  assert.notEqual(r.encounter.word.id, failed);
  r = answer(r); assert.notEqual(r.encounter.word.id, failed);
  r = answer(r); assert.equal(r.encounter.word.id, failed);
  while (r.phase !== 'finished') r = answer(r);
  assert.equal(r.answers.length, 10);
  assert.equal(r.answers.filter(a => a.wordId === failed).length, 2);
});
test('late errors are first in the next race; recovery schedules a ten-minute review', () => {
  let r = createRace(rng);
  for (let i = 0; i < 9; i++) r = answer(r);
  const failed = r.encounter.word.id;
  r = answer(r, false);
  const now = 1000000;
  const reviews = scheduleReviews({}, r.answers, now);
  assert.equal(reviews[failed].dueAt, now);
  assert.equal(createRace(rng, reviews, now).encounter.word.id, failed);
  const recovered = scheduleReviews({}, [{wordId: failed, result:'wrong'}, {wordId:failed, result:'correct'}], now);
  assert.equal(recovered[failed].dueAt, now + 600000);
  assert.equal(recovered[failed].stage, 0);
});
test('review intervals advance only when due; driving collisions do not penalize memory', () => {
  const correct = [{ wordId:'hello', result:'correct' }];
  let now = 1000000; let reviews = {};
  for (const days of [1, 3, 7, 14]) {
    reviews = scheduleReviews(reviews, correct, now);
    assert.equal(reviews.hello.dueAt, now + days * 86400000);
    assert.deepEqual(scheduleReviews(reviews, correct, now + 1), reviews);
    now = reviews.hello.dueAt;
  }
  assert.deepEqual(scheduleReviews(reviews, [{wordId:'hello',result:'collision'}], now), reviews);
});

test('replaying a recovered word before ten minutes cannot skip its learning interval', () => {
  const now = 1000000;
  const reviews = scheduleReviews({}, [{ wordId: 'hello', result: 'wrong' }, { wordId: 'hello', result: 'correct' }], now);
  assert.deepEqual(scheduleReviews(reviews, [{ wordId: 'hello', result: 'correct' }], now + 1), reviews);
  const due = scheduleReviews(reviews, [{ wordId: 'hello', result: 'correct' }], now + 600000);
  assert.equal(due.hello.stage, 1);
  assert.equal(due.hello.dueAt, now + 600000 + 86400000);
});
