export type Lane = 0 | 1 | 2;
export type Word = { id: string; es: string; en: string; distractor: string };
export const WORDS: Word[] = [
  { id: 'hello', es: 'Hola', en: 'Hello', distractor: 'Goodbye' },
  { id: 'water', es: 'Agua', en: 'Water', distractor: 'Milk' },
  { id: 'house', es: 'Casa', en: 'House', distractor: 'Horse' },
  { id: 'cat', es: 'Gato', en: 'Cat', distractor: 'Dog' },
  { id: 'sun', es: 'Sol', en: 'Sun', distractor: 'Moon' },
  { id: 'bread', es: 'Pan', en: 'Bread', distractor: 'Rice' },
  { id: 'book', es: 'Libro', en: 'Book', distractor: 'Desk' },
  { id: 'red', es: 'Rojo', en: 'Red', distractor: 'Blue' },
  { id: 'thanks', es: 'Gracias', en: 'Thank you', distractor: 'Please' },
  { id: 'car', es: 'Carro', en: 'Car', distractor: 'Bike' },
];
export const LANES: Lane[] = [0, 1, 2];
export const TOTAL = 10;
export const APPROACH_MS = 6800;
export const FEEDBACK_MS = 1800;
export type Encounter = { word: Word; blocked: Lane; correct: Lane; obstacle: 'cones' | 'car' | 'hole' };
export type Answer = { wordId: string; result: 'correct' | 'wrong' | 'collision'; selected: Lane; elapsedMs: number };
export type Race = {
  id: string; lane: Lane; phase: 'approach' | 'feedback' | 'finished'; elapsed: number;
  encounter: Encounter; deck: Word[]; answers: Answer[]; lives: number; score: number; combo: number;
};
function encounter(word: Word, blocked: Lane, index: number, random: () => number): Encounter {
  const choices = LANES.filter(l => l !== blocked);
  return { word, blocked, correct: choices[random() < 0.5 ? 0 : 1], obstacle: (['cones', 'car', 'hole'] as const)[index % 3] };
}
export type Review = { dueAt: number; stage: number; lapses: number };
export type Reviews = Record<string, Review>;
export function scheduleReviews(reviews: Reviews, answers: Answer[], now = Date.now()): Reviews {
  const next = { ...reviews };
  for (const id of new Set(answers.map(a => a.wordId))) {
    const attempts = answers.filter(a => a.wordId === id && a.result !== 'collision');
    if (!attempts.length) continue;
    const old = reviews[id];
    const failed = attempts.some(a => a.result === 'wrong');
    const recovered = failed && attempts.at(-1)?.result === 'correct';
    if (!failed && old && old.dueAt > now) continue;
    const stage = failed ? 0 : Math.min(4, (old?.stage ?? 0) + 1);
    const days = [0, 1, 3, 7, 14][stage];
    next[id] = { stage, lapses: (old?.lapses ?? 0) + (failed ? 1 : 0), dueAt: now + (failed ? (recovered ? 10 * 60_000 : 0) : days * 86_400_000) };
  }
  return next;
}
export function createRace(random = Math.random, reviews: Reviews = {}, now = Date.now()): Race {
  const deck = [...WORDS];
  // Fisher-Yates, keeping the first greeting as a friendly starting point.
  for (let i = deck.length - 1; i > 1; i--) { const j = 1 + Math.floor(random() * i); [deck[i], deck[j]] = [deck[j], deck[i]]; }
  // Stable sorting keeps shuffled ties; overdue reviews precede new vocabulary.
  deck.sort((a, b) => {
    const rank = (id: string) => !reviews[id] ? 1 : reviews[id].dueAt <= now ? 0 : 2;
    return rank(a.id) - rank(b.id) || (rank(a.id) === 0 ? reviews[a.id].dueAt - reviews[b.id].dueAt : 0);
  });
  return { id: `${Date.now()}-${random().toString(36).slice(2)}`, lane: 1, phase: 'approach', elapsed: 0,
    encounter: encounter(deck[0], 1, 0, random), deck, answers: [], lives: 3, score: 0, combo: 0 };
}
export function move(race: Race, direction: -1 | 1): Race {
  if (race.phase === 'finished') return race;
  return { ...race, lane: Math.max(0, Math.min(2, race.lane + direction)) as Lane };
}
export function tick(race: Race, delta: number, random = Math.random): Race {
  if (race.phase === 'finished' || delta <= 0) return race;
  const elapsed = race.elapsed + delta;
  if (race.phase === 'approach' && elapsed >= APPROACH_MS) {
    const result = race.lane === race.encounter.blocked ? 'collision' : race.lane === race.encounter.correct ? 'correct' : 'wrong';
    const combo = result === 'correct' ? race.combo + 1 : 0;
    const multiplier = 1 + Math.min(4, Math.floor(race.combo / 5)) * 0.25;
    const deck = [...race.deck];
    const retryIndex = race.answers.length + 3;
    if (result !== 'correct' && retryIndex < TOTAL) {
      // Two intervening encounters before retrieving the failed word again.
      deck.splice(retryIndex, 0, race.encounter.word);
      deck.length = TOTAL;
    }
    return { ...race, deck, elapsed: 0, phase: 'feedback', combo,
      lives: race.lives - (result === 'correct' ? 0 : 1),
      score: race.score + (result === 'correct' ? 100 * multiplier : 0),
      answers: [...race.answers, { wordId: race.encounter.word.id, result, selected: race.lane, elapsedMs: APPROACH_MS }] };
  }
  if (race.phase === 'feedback' && elapsed >= FEEDBACK_MS) {
    if (race.lives === 0 || race.answers.length >= TOTAL) return { ...race, phase: 'finished', elapsed: 0, score: race.score + (race.lives > 0 ? 300 : 0) };
    return { ...race, elapsed: 0, phase: 'approach', encounter: encounter(race.deck[race.answers.length], race.lane, race.answers.length, random) };
  }
  return { ...race, elapsed };
}
