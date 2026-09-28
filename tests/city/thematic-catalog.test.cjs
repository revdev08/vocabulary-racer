const { test } = require('node:test');
const assert = require('node:assert/strict');
const { thematicCatalog } = require('../../.qa/geometry/data/thematicCatalog.js');
const { excelCatalog } = require('../../.qa/geometry/data/excelCatalog.js');
const { levels, vocabulary, importedUnits, historicalLevels } = require('../../.qa/geometry/data/vocabulary.js');
const { journeyUnits, readJourneyPage } = require('../../.qa/geometry/data/journey.js');
const { createRun } = require('../../.qa/geometry/gameplay/engine.js');
const { recordLevel, unlockedLevelIndex, dueWordIndices } = require('../../.qa/geometry/gameplay/curriculum.js');

test('every source word belongs to exactly one explicit topic, with no general fallback', () => {
  assert.equal(thematicCatalog.topics.length, 72);
  assert.equal(new Set(thematicCatalog.topics.map(topic => topic.categoryId)).size, 24);
  const ids = thematicCatalog.topics.flatMap(topic => topic.races.flatMap(race => race.wordIds));
  assert.equal(ids.length, 3847);
  assert.equal(new Set(ids).size, 3847);
  assert.deepEqual(new Set(ids), new Set(excelCatalog.words.map(word => word.id)));
  for (const topic of thematicCatalog.topics) {
    assert.doesNotMatch(topic.title, /general|conceptos y descriptores/i);
    for (const race of topic.races) {
      assert.ok(race.wordIds.length >= 5 && race.wordIds.length <= 10);
      for (const id of race.wordIds) assert.equal(thematicCatalog.wordTopics[id], topic.id);
    }
  }
});

test('lesson titles name the complete topic instead of listing sample words', () => {
  const titles = importedUnits.flatMap(unit => unit.levels.map(level => level.title.toLowerCase()));
  assert.equal(new Set(titles).size, titles.length);
  for (const title of titles) {
    assert.ok(title.length <= 52);
    assert.doesNotMatch(title, /vocabulario general| · \d+$/i);
  }
  for (const topic of thematicCatalog.topics) {
    topic.races.forEach((race, index) => {
      assert.equal(race.title, topic.title + (topic.races.length > 1 ? ` · Parte ${index + 1}` : ''));
    });
  }
  assert.equal(levels[12].title, 'Familia y parentesco · Parte 1');
  assert.equal(levels[12].topicId, 'familia-y-parentesco');
  assert.ok(levels[12].indices.every(i => ['family', 'mother', 'father', 'parent', 'son', 'daughter', 'brother', 'sister', 'child'].includes(vocabulary[i].correct)));
});

test('homographs follow the taught meaning, not just the English spelling', () => {
  const topic = (english, spanish) => {
    const word = excelCatalog.words.find(word => word.correct === english && word.spanish === spanish);
    assert.ok(word, `${english}: ${spanish}`);
    return thematicCatalog.wordTopics[word.id];
  };
  assert.equal(topic('can', 'lata'), 'herramientas-y-materiales');
  assert.equal(topic('can', 'poder (tener capacidad)'), 'auxiliares-y-expresiones-basicas');
  assert.equal(topic('tear', 'lágrima'), 'partes-del-cuerpo');
  assert.equal(topic('tear', 'rasgar'), 'sujetar-y-manipular');
  assert.equal(topic('coach', 'entrenador'), 'deportes-y-juegos');
  assert.equal(topic('park', 'parque'), 'edificios-y-servicios');
});

test('journey pages stop at topic boundaries and expose the category for each real unit', () => {
  const collected = [];
  let cursor = 0;
  do {
    const page = readJourneyPage(cursor);
    collected.push(...page.units);
    cursor = page.nextCursor;
  } while (cursor !== null);
  assert.deepEqual(collected, journeyUnits);
  for (const unit of journeyUnits.slice(3)) {
    const actual = unit.data.map(item => levels.find(level => level.id === item.id));
    assert.ok(actual.length <= 4);
    assert.equal(new Set(actual.map(level => level.topicId)).size, 1);
    assert.equal(unit.category, actual[0].category);
  }
});

test('historical results and reviews remain valid without awarding new-topic stars', () => {
  const original = historicalLevels[12];
  let records = recordLevel({}, { levelId: original.id, mode: 'level', completed: true, firstCorrect: original.indices.length, wordTarget: original.indices.length, score: 1000 });
  assert.equal(records[original.id].bestScore, 1000);
  assert.equal(records[levels[12].id], undefined);
  for (const level of levels.slice(0, 12)) records[level.id] = { completed: true, bestFirstCorrect: 10, attempts: 1 };
  assert.equal(unlockedLevelIndex(records), 12);
  const legacyRun = createRun(7, 8, original.id);
  assert.equal(legacyRun.levelId, original.id);
  assert.deepEqual(new Set(legacyRun.deck), new Set(original.indices));
  const word = vocabulary[original.indices[0]];
  assert.deepEqual(dueWordIndices({ [word.id]: { dueAt: 100 } }, 100), [original.indices[0]]);
});
