import { vocabulary as legacyWords, levels as legacyLevels } from './legacyVocabulary';
import { excelCatalog } from './excelCatalog';
import type { VocabularyEntry, VocabularyLevel } from './legacyVocabulary';
export type { VocabularyEntry, VocabularyLevel } from './legacyVocabulary';

const words: VocabularyEntry[] = [...legacyWords];
const pairKey = (english: string, spanish: string) => `${english.toLocaleLowerCase()}\u0000${spanish.toLocaleLowerCase()}`;
const byPair = new Map(words.map((word, index) => [pairKey(word.correct, word.spanish), index]));
const excelIndices = new Map<string, number>();
for (const entry of excelCatalog.words) {
  const key = pairKey(entry.correct, entry.spanish);
  const existing = byPair.get(key);
  const index = existing ?? words.length;
  const word: VocabularyEntry = { id: existing === undefined ? entry.id : words[existing].id,
    spanish: entry.spanish, correct: entry.correct, distractors: [entry.distractors[0], entry.distractors[1]] };
  if (existing === undefined) { words.push(word); byPair.set(key, index); }
  else words[index] = word;
  excelIndices.set(entry.id, index);
}
export const vocabulary: readonly VocabularyEntry[] = words;
export const importedUnits = excelCatalog.units.map(unit => ({ ...unit,
  levels: unit.races.map((race, index): VocabularyLevel => ({ id: race.id,
    title: `${unit.title} · ${index + 1}`, difficulty: 'Vocabulario temático',
    indices: race.wordIds.map(id => {
      const position = excelIndices.get(id);
      if (position === undefined) throw new Error(`Missing vocabulary ${id}`);
      return position;
    }),
  })),
}));
// Keep the original introductory route and its IDs so old completion and review records survive.
export const levels: readonly VocabularyLevel[] = [...legacyLevels, ...importedUnits.flatMap(unit => unit.levels)];
