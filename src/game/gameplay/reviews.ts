import type { RunState } from './types';
import { dueWordIndices } from './curriculum';
import { random } from './random';
export function withDueReviews(run: RunState, reviews: Record<string, { dueAt: number }>, now: number): RunState {
  const due = dueWordIndices(reviews, now);
  const deck = [...run.deck];
  let seed = run.seed;
  for (let i = deck.length - 1; i > 0; i--) {
    const roll = random(seed); seed = roll.seed;
    const j = Math.floor(roll.value * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  const rank = (index: number) => { const position = due.indexOf(index); return position < 0 ? Infinity : position; };
  deck.sort((a, b) => rank(a) - rank(b));
  // Reserve two of the three extra encounters for errors made during this race.
  return { ...run, deck, reviews: due.filter(index => !deck.includes(index)).slice(0, 1).map(index => ({ index, due: 2 })) };
}
