const assert = require('node:assert/strict');
const { test } = require('node:test');
const { levels, vocabulary } = require('../../.qa/geometry/data/vocabulary.js');
const { createRun, advanceGame, gameView } = require('../../.qa/geometry/gameplay/engine.js');
const { routeTarget } = require('../../.qa/geometry/gameplay/patterns.js');
const { passedLevel, recordLevel, unlockedLevelIndex, dueWordIndices } = require('../../.qa/geometry/gameplay/curriculum.js');
const { withDueReviews } = require('../../.qa/geometry/gameplay/reviews.js');
function play(initial, wrongAt = []) {
  let run = initial;
  const answers = [];
  for (let frame = 0; frame < 30000 && run.phase !== 'gameOver'; frame++) {
    const count = run.correct + run.errors;
    const correctLane = run.question?.correctLane ?? 0;
    const lane = run.phase === 'traffic' ? routeTarget(run.plan, run.plan.initialLateral, run.phaseTime)
      : wrongAt.includes(count) ? (correctLane === 0 ? 1 : 0) : correctLane;
    const next = advanceGame(run, 1/60, lane);
    if (next.correct + next.errors > count) answers.push({ id: next.question.id, review: next.currentIsReview });
    run = next;
  }
  assert.equal(run.phase, 'gameOver', 'bounded session must terminate');
  return { run, answers };
}
test('curriculum covers all imported words in bounded groups with stable unique identifiers', () => {
  assert.equal(levels.length, 407);
  const indices = levels.flatMap(level => level.indices);
  assert.equal(new Set(indices).size, vocabulary.length);
  assert.equal(new Set(levels.map(level => level.id)).size, levels.length);
  for (const level of levels) {
    assert.ok(level.indices.length > 0 && level.indices.length <= 10);
    for (const index of level.indices) assert.ok(vocabulary[index]);
  }
});
test('each level ends after ten correct core answers and preserves all driving lives', () => {
  const samples = levels.filter((level, index) => index < 12 || index % 20 === 0 || level.indices.length < 10);
  for (const level of samples) {
    const { run, answers } = play(createRun(183, 1, level.id));
    assert.equal(run.completed, true); assert.equal(run.lives, 3);
    assert.equal(run.firstCorrect, level.indices.length); assert.equal(run.correct, level.indices.length);
    assert.equal(answers.length, level.indices.length); assert.equal(passedLevel(gameView(run)), true);
    assert.deepEqual(new Set(answers.map(answer => answer.id)), new Set(level.indices.map(index => vocabulary[index].id)));
    assert.strictEqual(advanceGame(run, .1, 0), run);
  }
});
test('an early error returns after three intervening questions, without replacing core vocabulary', () => {
  const { run, answers } = play(createRun(197), [0]);
  assert.equal(answers[0].id, answers[4].id);
  assert.equal(answers[4].review, true);
  assert.equal(run.firstCorrect, 9); assert.equal(run.correct, 10);
  assert.equal(run.reviewCount, 1); assert.equal(run.completed, true);
  assert.equal(new Set(answers.map(answer => answer.id)).size, 10);
});
test('a late error does not create filler or an endless session', () => {
  const { run, answers } = play(createRun(281), [9]);
  assert.equal(answers.length, 10); assert.equal(run.completed, true);
  assert.equal(run.errors, 1); assert.equal(run.reviews.length, 1);
  assert.equal(run.firstCorrect, 9);
});
test('overdue review and two recovered errors stay within the thirteen-question budget', () => {
  const initial = withDueReviews(createRun(851), { hello: { dueAt: 0 } }, 100);
  const { run, answers } = play(initial, [0, 1]);
  assert.equal(run.completed, true); assert.equal(run.firstCorrect, 8);
  assert.equal(answers.length, 13); assert.equal(run.reviewCount, 3);
  assert.equal(passedLevel(gameView(run)), true);
});
test('life loss and review-only sessions never unlock curriculum levels', () => {
  const lost = play(createRun(7), [0, 1, 2]).run;
  assert.equal(lost.completed, false); assert.equal(passedLevel(gameView(lost)), false);
  const review = play(createRun(7, 1, 'essentials', [10, 60])).run;
  assert.equal(review.completed, true); assert.equal(review.correct, 2);
  assert.equal(passedLevel(gameView(review)), false);
  assert.deepEqual(recordLevel({}, gameView(review)), {});
});
test('unlocks are sequential and completion survives a later failed attempt', () => {
  const passed = { levelId: 'essentials', mode: 'level', completed: true, firstCorrect: 8, wordTarget: 10 };
  let records = recordLevel({}, passed);
  assert.equal(unlockedLevelIndex(records), 1);
  records = recordLevel(records, { ...passed, completed: false, firstCorrect: 2 });
  assert.equal(records.essentials.completed, true); assert.equal(records.essentials.attempts, 2);
  assert.equal(records.essentials.bestFirstCorrect, 8);
  assert.equal(unlockedLevelIndex({ ...records, family: { completed: true } }), 1);
  assert.equal(passedLevel({ ...passed, firstCorrect: 7 }), false);
});
test('due selection ignores unknown words and future dates; short review remains finite after failure', () => {
  const indices = dueWordIndices({ hello: { dueAt: 10 }, dog: { dueAt: 200 }, obsolete: { dueAt: 0 } }, 100);
  assert.deepEqual(indices.map(index => vocabulary[index].id), ['hello']);
  const { run } = play(createRun(15, 1, 'essentials', indices), [0]);
  assert.equal(run.completed, true); assert.equal(run.errors, 1); assert.equal(run.correct, 0);
});

test('both correct and incorrect choices pronounce the correct English answer only once', () => {
  const { answerEvent } = require('../../.qa/geometry/gameplay/answerEvent.js');
  const base = { ...gameView(createRun(1)), question: { id: 'hello', word: 'Hola', correct: 'Hello', options: ['Hello', 'Thanks', 'Goodbye'], correctLane: -1 } };
  for (const kind of ['correct', 'wrong']) {
    const event = { ...base, [kind === 'correct' ? 'correct' : 'errors']: 1, selectedLane: kind === 'correct' ? -1 : 0, feedback: { kind } };
    assert.equal(answerEvent(event, 0).translation, 'Hello');
    assert.equal(answerEvent(event, 0).result, kind);
    assert.equal(answerEvent(event, 1), null);
  }
  assert.equal(answerEvent({ ...base, feedback: { kind: 'collision' } }, 0), null);
  assert.equal(answerEvent(base, 0), null);
});

test('an empty review ends immediately instead of silently starting new vocabulary', () => {
  const run = createRun(7, 1, 'essentials', []);
  assert.equal(run.mode, 'review'); assert.equal(run.phase, 'gameOver');
  assert.equal(run.completed, true); assert.equal(run.correct + run.errors, 0);
  assert.strictEqual(advanceGame(run, .1, 0), run);
});
