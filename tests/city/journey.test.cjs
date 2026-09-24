const { test } = require('node:test');
const assert = require('node:assert/strict');
const { journeyUnits, buildJourneyUnits, readJourneyPage, levelState, developmentJourney, vocabularyGroups } = require('../../.qa/geometry/data/journey.js');
const { levels } = require('../../.qa/geometry/data/vocabulary.js');
const { recordLevel, earnedStars, unlockedLevelIndex } = require('../../.qa/geometry/gameplay/curriculum.js');
test('initial page contains two genuine four-level units and retains remaining catalog', () => {
  const page = readJourneyPage();
  assert.deepEqual(page.units.map(unit => unit.data.length), [4,4]);
  assert.equal(page.nextCursor, 2);
  assert.equal(readJourneyPage(page.nextCursor).units.length, 1);
  assert.equal(new Set(journeyUnits.flatMap(unit => unit.data.map(level => level.id))).size, 12);
  assert.ok(vocabularyGroups.every(group => group.indices.length === 10));
});
test('selection cannot change progression; completion unlocks next level', () => {
  assert.equal(levelState('essentials', {}), 'available');
  assert.equal(levelState('greetings', {}), 'locked');
  const records = recordLevel({}, { levelId:'essentials', mode:'level', completed:true, firstCorrect:8, wordTarget:10, score:800 });
  assert.equal(levelState('essentials',records),'completed');
  assert.equal(levelState('greetings',records),'available');
  assert.equal(unlockedLevelIndex(records),1);
});
test('stars require finishing; failed repetition preserves best score and stars', () => {
  const result = { levelId:'essentials', mode:'level', completed:true, firstCorrect:10, wordTarget:10, score:1000 };
  assert.deepEqual([8,9,10].map(firstCorrect => earnedStars({...result,firstCorrect})), [1,2,3]);
  assert.equal(earnedStars({...result,completed:false}),0);
  const repeated = recordLevel(recordLevel({},result), {...result,completed:false,firstCorrect:2,score:200});
  assert.equal(repeated.essentials.bestStars,3);
  assert.equal(repeated.essentials.bestScore,1000);
  assert.equal(repeated.essentials.completed,true);
});
test('stress catalog has 1000 unique non-playable development entries and long titles', () => {
  const entries = developmentJourney().flatMap(unit => unit.data);
  assert.equal(entries.length,1000);
  assert.equal(new Set(entries.map(level => level.id)).size,1000);
  assert.ok(entries.every(level => level.development));
  assert.ok(entries.some(level => level.title.length > 60));
  assert.equal(entries.at(-1).number, 1000);
});

test('journey numbers remain sequential across units and source IDs retain saved progress', () => {
  const entries = journeyUnits.flatMap(unit => unit.data);
  assert.deepEqual(entries.map(level => level.number), Array.from({ length: 12 }, (_, i) => i + 1));
  assert.deepEqual(entries.map(level => level.sourceId), levels.map(level => level.id));
});

test('extending the catalog creates units without changing existing keys or numbering', () => {
  const extra = Array.from({ length: 989 }, (_, i) => ({ ...levels[0], id: `future-${i}`, title: `Future ${i}` }));
  const extended = buildJourneyUnits([...levels, ...extra]);
  assert.deepEqual(extended.slice(0, 3), journeyUnits);
  assert.equal(extended.length, 251);
  assert.equal(extended.at(-1).data.length, 1);
  assert.equal(extended.at(-1).data[0].number, 1001);
  assert.equal(new Set(extended.map(unit => unit.key)).size, 251);
  assert.deepEqual(buildJourneyUnits([]), []);
});

test('catalog pagination stops at real content and rejects invalid cursors', () => {
  assert.equal(readJourneyPage(2).nextCursor, null);
  assert.deepEqual(readJourneyPage(3), { units: [], nextCursor: null });
  assert.throws(() => readJourneyPage(-1), RangeError);
  assert.throws(() => readJourneyPage(0, 0), RangeError);
});
