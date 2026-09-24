const { test } = require('node:test');
const assert = require('node:assert/strict');
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
    const actual = vocabulary.find(word => word.spanish === entry.spanish && word.correct === entry.correct);
    assert.ok(actual, entry.correct);
    assert.deepEqual(actual.distractors, entry.distractors);
    assert.equal(new Set([actual.correct, ...actual.distractors].map(word => word.toLowerCase())).size, 3);
  }
  for (const unit of importedUnits) {
    assert.equal(unit.title, excelCatalog.units.find(source => source.id === unit.id).title);
    for (const level of unit.levels) assert.ok(level.indices.length > 0 && level.indices.length <= 10);
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
