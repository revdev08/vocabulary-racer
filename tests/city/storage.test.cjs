const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function transpile(file, dependencies) {
  const source = fs.readFileSync(path.resolve(__dirname, '../../src/game', file), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => {
    if (!(id in dependencies)) throw new Error(`Unexpected dependency: ${id}`);
    return dependencies[id];
  }, module, module.exports);
  return module.exports;
}
function storage(initial) {
  let raw = initial ? JSON.stringify(initial) : null;
  let writes = 0, fail = false;
  const api = transpile('storage.ts', {
    '@react-native-async-storage/async-storage': { getItem: async () => raw, setItem: async (_key, value) => { if (fail) throw Error('Disk unavailable'); raw = value; writes++; } },
    './engine': transpile('engine.ts', {}),
    './gameplay/curriculum': require('../../.qa/geometry/gameplay/curriculum.js'),
  });
  return { ...api, writes: () => writes, fail: value => { fail = value; } };
}
const result = { levelId: 'essentials', mode: 'level', completed: true, firstCorrect: 9, wordTarget: 10 };
const race = { id: 'run-1', phase: 'finished', score: 1000, answers: [{ wordId: 'hello', result: 'wrong' }], levelResult: result };
test('old local progress migrates without losing records or overdue mistakes', async () => {
  const api = storage({ version: 1, best: 1100, races: 4, recentIds: ['old'], practice: ['house'] });
  const progress = await api.readProgress();
  assert.equal(progress.best, 1100); assert.equal(progress.reviews.house.dueAt, 0);
  assert.deepEqual(progress.levels, {});
});
test('saving updates SRS and level records atomically, and duplicate runs are idempotent', async () => {
  const api = storage();
  await Promise.all([api.saveRace(race), api.saveRace(race)]);
  const progress = await api.readProgress();
  assert.equal(api.writes(), 1); assert.equal(progress.races, 1);
  assert.equal(progress.levels.essentials.completed, true);
  assert.equal(progress.levels.essentials.bestStars, 2);
  assert.equal(progress.levels.essentials.bestScore, 1000);
  assert.equal(progress.reviews.hello.stage, 0);
  assert.ok(progress.practice.includes('hello'));
  await api.saveRace({ ...race, id: 'run-2', levelResult: { ...result, mode: 'review' }, answers: [{ wordId: 'hello', result: 'correct' }] });
  assert.equal((await api.readProgress()).levels.essentials.attempts, 1);
});
test('concurrent saves keep both results and a failed write does not poison the queue', async () => {
  const api = storage();
  api.fail(true);
  await assert.rejects(api.saveRace(race));
  api.fail(false);
  await Promise.all([api.saveRace(race), api.saveRace({ ...race, id: 'run-2', levelResult: { ...result, levelId: 'greetings' } })]);
  const progress = await api.readProgress();
  assert.equal(progress.races, 2); assert.equal(progress.levels.greetings.completed, true);
  assert.equal(progress.levels.essentials.attempts, 1);
});
test('abandoned runs do not grant completion or change the spaced-repetition schedule', async () => {
  const api = storage();
  await api.saveRace({ ...race, phase: 'approach' });
  assert.equal(api.writes(), 0);
});

test('legacy completions migrate conservatively and repeated runs keep earned records after reload', async () => {
  const api = storage({ version: 1, best: 1100, races: 4, recentIds: ['old'], practice: [], levels: {
    essentials: { completed: true, bestFirstCorrect: 10, attempts: 2 },
  } });
  assert.equal((await api.readProgress()).levels.essentials.bestStars, 1);
  await api.saveRace({ ...race, levelResult: { ...result, firstCorrect: 10 } });
  await api.saveRace({ ...race, id: 'failed-repeat', score: 100, levelResult: { ...result, completed: false, firstCorrect: 1 } });
  const restored = await api.readProgress();
  assert.equal(restored.levels.essentials.bestStars, 3);
  assert.equal(restored.levels.essentials.bestScore, 1000);
  assert.equal(restored.levels.essentials.completed, true);
});
