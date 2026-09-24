import { levels, vocabulary, importedUnits } from './vocabulary';
import type { LevelRecords } from '../gameplay/curriculum';

export type JourneyLevel = { id: string; sourceId: string; title: string; number: number; theme: 'coast' | 'city' | 'mountain'; development?: boolean };
export type JourneyUnit = { key: string; title: string; number: number; data: JourneyLevel[] };
export const vocabularyGroups = levels.map(level => ({ id: level.id, indices: level.indices }));
const definitions = [
  { key: 'departure', title: 'Primeros kilómetros', theme: 'coast' as const, ids: ['essentials', 'greetings', 'family', 'home'] },
  { key: 'everyday', title: 'Vida cotidiana', theme: 'city' as const, ids: ['meals', 'city', 'time', 'actions'] },
  { key: 'horizons', title: 'Nuevos horizontes', theme: 'mountain' as const, ids: ['descriptions', 'travel', 'feelings', 'ideas'] },
];
const introductoryUnits: JourneyUnit[] = definitions.map((unit, index) => ({ key: unit.key, title: unit.title, number: index + 1,
  data: unit.ids.map((id, i) => {
    const level = levels.find(item => item.id === id);
    if (!level || level.indices.some(word => !vocabulary[word])) throw new Error(`Invalid journey vocabulary: ${id}`);
    return { id, sourceId: id, title: level.title, number: i + 1, theme: unit.theme };
  }),
}));
export const journeyUnits: JourneyUnit[] = [...introductoryUnits, ...importedUnits.map((unit, index) => ({
  key: `es-en-unit-${unit.id}`, title: unit.title, number: introductoryUnits.length + index + 1,
  data: unit.levels.map((level, position) => ({ id: level.id, sourceId: level.id, title: level.title,
    number: position + 1, theme: (['coast', 'city', 'mountain'] as const)[index % 3] })),
}))];
// Local pages today; a future repository can implement this same cursor contract.
export function readJourneyPage(cursor = 0, size = 2): { units: JourneyUnit[]; nextCursor: number | null } {
  const end = Math.min(cursor + size, journeyUnits.length);
  return { units: journeyUnits.slice(cursor, end), nextCursor: end < journeyUnits.length ? end : null };
}
export function levelState(id: string, records: LevelRecords): 'completed' | 'available' | 'locked' {
  if (records[id]?.completed) return 'completed';
  const index = levels.findIndex(level => level.id === id);
  return index >= 0 && levels.slice(0, index).every(level => records[level.id]?.completed) ? 'available' : 'locked';
}
export function developmentJourney(): JourneyUnit[] {
  return Array.from({ length: 50 }, (_, unit) => ({ key: `dev-unit-${unit}`, number: unit + 1, title: `Prueba de recorrido ${unit + 1}`,
    data: Array.from({ length: 20 }, (_, i) => ({ id: `dev-level-${unit * 20 + i}`, sourceId: levels[i % levels.length].id,
      number: i + 1, title: i % 7 === 0 ? 'Un título de nivel muy largo para comprobar la adaptación del boleto' : levels[i % levels.length].title,
      theme: 'coast' as const, development: true })),
  }));
}
