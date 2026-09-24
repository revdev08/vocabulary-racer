import { levels, vocabulary } from '../data/vocabulary';
export type LevelRecord = { completed: boolean; bestFirstCorrect: number; attempts: number; bestStars?: number; bestScore?: number };
export type LevelRecords = Record<string, LevelRecord>;
export function unlockedLevelIndex(records: LevelRecords): number {
  let index = 0;
  while (index < levels.length - 1 && records[levels[index].id]?.completed) index++;
  return index;
}
export function dueWordIndices(reviews: Record<string, { dueAt: number }>, now: number): number[] {
  return vocabulary.map((word, index) => ({ index, review: reviews[word.id] }))
    .filter(item => item.review && item.review.dueAt <= now)
    .sort((a, b) => a.review.dueAt - b.review.dueAt).map(item => item.index);
}
export type LevelResult = { levelId: string; mode: 'level' | 'review'; completed: boolean; firstCorrect: number; wordTarget: number; score?: number };
export function passedLevel(result: LevelResult): boolean {
  return result.mode === 'level' && result.completed && result.wordTarget > 0 && result.firstCorrect >= Math.ceil(result.wordTarget * .8);
}
export function earnedStars(result: LevelResult): number {
  if (!passedLevel(result)) return 0;
  return result.firstCorrect >= result.wordTarget ? 3 : result.firstCorrect >= Math.ceil(result.wordTarget * .9) ? 2 : 1;
}
export function recordLevel(records: LevelRecords, result?: LevelResult): LevelRecords {
  if (!result || result.mode !== 'level' || !levels.some(level => level.id === result.levelId)) return records;
  const old = records[result.levelId];
  return { ...records, [result.levelId]: { completed: !!old?.completed || passedLevel(result),
    bestFirstCorrect: Math.max(old?.bestFirstCorrect ?? 0, result.firstCorrect), attempts: (old?.attempts ?? 0) + 1, bestStars: Math.max(old?.bestStars ?? (old?.completed ? 1 : 0), earnedStars(result)), bestScore: Math.max(old?.bestScore ?? 0, result.score ?? 0) } };
}
