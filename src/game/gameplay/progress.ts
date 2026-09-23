import { withDueReviews } from './reviews';
import { readProgress, saveRace } from '../storage';
import type { Answer } from '../engine';
import { levels } from '../data/vocabulary';
import { dueWordIndices, unlockedLevelIndex } from './curriculum';
import { createRun } from './engine';
import type { GameView, RunState } from './types';
export async function loadCityRun(seed: number, runId: number, existing?: RunState, requestedLevel = 'essentials', review = false) {
  const progress = await readProgress();
  const unlocked = unlockedLevelIndex(progress.levels);
  const requestedIndex = levels.findIndex(level => level.id === requestedLevel);
  const level = levels[requestedIndex >= 0 && requestedIndex <= unlocked ? requestedIndex : unlocked];
  const due = dueWordIndices(progress.reviews, Date.now());
  if (review) return createRun(seed, runId, level.id, due.slice(0, 10));
  const run = existing?.levelId === level.id && existing.mode === 'level' ? existing : createRun(seed, runId, level.id);
  return withDueReviews(run, progress.reviews, Date.now());
}
export function saveCityRun(id: string, view: GameView, answers: Answer[]) {
  return saveRace({ id, phase: 'finished', score: view.score, answers, levelResult: view });
}
