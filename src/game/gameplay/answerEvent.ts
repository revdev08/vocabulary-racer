import type { GameView } from './types';
/** A vocabulary answer is emitted once; traffic snapshots never pronounce words. */
export function answerEvent(view: GameView, processed: number) {
  if (!view.question || view.correct + view.errors <= processed ||
    (view.feedback?.kind !== 'correct' && view.feedback?.kind !== 'wrong')) return null;
  return { wordId: view.question.id, translation: view.question.correct,
    result: view.feedback.kind, selected: ((view.selectedLane ?? 0) + 1) as 0 | 1 | 2, elapsedMs: 4000 };
}
