const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
test('every city asset resolves inside the app and is a PNG', () => {
  const config = path.join(root, 'src/game/config/assets.ts');
  const source = fs.readFileSync(config, 'utf8');
  const paths = [...source.matchAll(/require\('([^']+)'\)/g)].map(m => m[1]);
  assert.equal(paths.length, 12);
  for (const asset of paths) {
    const target = path.resolve(path.dirname(config), asset);
    assert.ok(target.startsWith(path.join(root, 'assets/game') + path.sep));
    assert.equal(fs.readFileSync(target).subarray(1, 4).toString(), 'PNG');
  }
});
test('runtime imports are independent of the removable reference project', () => {
  function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) inspect(target);
      else if (/\.tsx?$/.test(entry.name)) assert.doesNotMatch(fs.readFileSync(target, 'utf8'), /(?:from\s*|import\s*\(|require\s*\()[\s]*['"][^'"]*basegame/);
    }
  }
  inspect(path.join(root, 'src'));
  assert.doesNotMatch(fs.readFileSync(path.join(root, 'src/game/RaceEntry.tsx'), 'utf8'), /WithSkiaWeb|canvaskit/);
});

test('stored due words enter the city queue without mutating shared initial state', () => {
  const { createRun } = require('../../.qa/geometry/gameplay/engine.js');
  const { withDueReviews } = require('../../.qa/geometry/gameplay/reviews.js');
  const { vocabulary } = require('../../.qa/geometry/data/vocabulary.js');
  const original = Object.freeze(createRun(42));
  const run = withDueReviews(original, { house: {dueAt: 90}, water: {dueAt: 10}, dog: {dueAt: 200}, hello: {dueAt: 0} }, 100);
  assert.deepEqual(run.reviews.map(item => vocabulary[item.index].id), ['hello']);
  assert.deepEqual(run.deck.slice(0,2).map(index => vocabulary[index].id), ['water', 'house']);
  assert.deepEqual(original.reviews, []);
  assert.deepEqual(run.plan, original.plan);
});
