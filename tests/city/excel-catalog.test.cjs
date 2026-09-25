const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const translationReview = require('../../content/es-en/translation-review.json');
const { excelCatalog } = require('../../.qa/geometry/data/excelCatalog.js');
const { vocabulary, importedUnits, levels } = require('../../.qa/geometry/data/vocabulary.js');
const { vocabulary: legacy } = require('../../.qa/geometry/data/legacyVocabulary.js');
const { dueWordIndices } = require('../../.qa/geometry/gameplay/curriculum.js');
const { withDueReviews } = require('../../.qa/geometry/gameplay/reviews.js');
const { createRun } = require('../../.qa/geometry/gameplay/engine.js');

test('all workbook rows, unit names and distractors are retained without fabricated content', () => {
  assert.equal(excelCatalog.words.reduce((n, word) => n + word.sourceRows.length, 0), 3870);
  assert.equal(excelCatalog.words.length, 3847);
  assert.equal(importedUnits.length, 23);
  assert.equal(importedUnits.flatMap(unit => unit.levels).length, 395);
  for (const entry of excelCatalog.words) {
    const actual = vocabulary.find(word => word.id === entry.runtimeId);
    assert.ok(actual, entry.correct);
    assert.equal(actual.spanish, entry.spanish);
    assert.equal(actual.correct, entry.correct);
    assert.deepEqual(actual.distractors, entry.distractors);
    assert.equal(new Set([actual.correct, ...actual.distractors].map(word => word.toLowerCase())).size, 3);
  }
  for (const unit of importedUnits) {
    assert.equal(unit.title, excelCatalog.units.find(source => source.id === unit.id).title);
    for (const level of unit.levels) assert.ok(level.indices.length > 0 && level.indices.length <= 10);
  }
});
test('translation corrections preserve every pre-existing review ID, word position and race membership', () => {
  const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
  assert.equal(digest(vocabulary.map(word => word.id)), 'd78a3d48e1efc4c348c9b56e0523147514bdf4617325a992104d40493318a6fc');
  assert.equal(digest(levels.map(({ id, indices }) => ({ id, indices }))), '7ba5af2f2dee651d5aa495ec34a521060a0545a06f00a1615a3133a67186c037');
  const word = vocabulary.find(word => word.correct === 'look forward to');
  assert.equal(word.spanish, 'esperar con ilusión');
  const savedReviews = { [word.id]: { dueAt: 172800000, stage: 2 } };
  assert.deepEqual(dueWordIndices(savedReviews, 172800000), [vocabulary.indexOf(word)]);
});
test('every reviewed translation reaches the game and dictionary sense numbers are not playable labels', () => {
  for (const change of translationReview.changes.filter(change => change.column === 'D')) {
    const word = vocabulary.find(word => word.id === change.runtimeId);
    assert.equal(word.spanish, change.after, `${change.english} at row ${change.row}`);
  }
  for (const word of vocabulary) {
    for (const choice of [word.correct, ...word.distractors]) assert.doesNotMatch(choice, / [12]$/);
  }
  assert.equal(vocabulary.find(word => word.correct === 'sympathy').spanish, 'compasión / comprensión');
  assert.equal(vocabulary.find(word => word.correct === 'thank you').spanish, 'gracias');
  for (const [correct, synonym] of [['do without', 'go without'], ['downwards', 'downward'],
    ['examination', 'exam'], ['sit down', 'sit'], ['village', 'town']]) {
    assert.ok(!vocabulary.find(word => word.correct === correct).distractors.includes(synonym));
  }
});
test('original word IDs and positions remain compatible with saved progress', () => {
  legacy.forEach((word, index) => assert.equal(vocabulary[index].id, word.id));
  assert.equal(levels[0].id, 'essentials');
  assert.equal(levels[11].id, 'ideas');
  assert.equal(levels[12].id, 'es-en-u01-r001');
});
test('an imported word becomes due on its saved date and can appear in another level', () => {
  const index = importedUnits[22].levels[0].indices[0];
  const word = vocabulary[index];
  const tomorrow = 172800000;
  const reviews = { [word.id]: { dueAt: tomorrow } };
  assert.deepEqual(dueWordIndices(reviews, tomorrow - 1), []);
  assert.deepEqual(dueWordIndices(reviews, tomorrow), [index]);
  const run = withDueReviews(createRun(51, 1, 'essentials'), reviews, tomorrow);
  assert.deepEqual(run.reviews, [{ index, due: 2 }]);
});
