import { vocabulary as legacyWords, levels as legacyLevels } from './legacyVocabulary';
import { excelCatalog } from './excelCatalog';
import type { VocabularyEntry, VocabularyLevel } from './legacyVocabulary';
export type { VocabularyEntry, VocabularyLevel } from './legacyVocabulary';

const words: VocabularyEntry[] = [...legacyWords];
const byId = new Map(words.map((word, index) => [word.id, index]));
const excelIndices = new Map<string, number>();
for (const entry of excelCatalog.words) {
  const existing = byId.get(entry.runtimeId);
  const index = existing ?? words.length;
  const word: VocabularyEntry = { id: entry.runtimeId,
    spanish: entry.spanish, correct: entry.correct, distractors: [entry.distractors[0], entry.distractors[1]] };
  if (existing === undefined) { words.push(word); byId.set(word.id, index); }
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
