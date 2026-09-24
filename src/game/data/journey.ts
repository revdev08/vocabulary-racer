import { levels, vocabulary } from './vocabulary';
import type { LevelRecords } from '../gameplay/curriculum';

export type JourneyLevel = { id: string; sourceId: string; title: string; number: number; theme: 'coast' | 'city' | 'mountain'; development?: boolean };
export type JourneyUnit = { key: string; title: string; number: number; data: JourneyLevel[] };
export const vocabularyGroups = levels.map(level => ({ id: level.id, indices: level.indices }));
const definitions = [
  { key: 'departure', title: 'Primeros kilómetros', theme: 'coast' as const },
  { key: 'everyday', title: 'Vida cotidiana', theme: 'city' as const },
  { key: 'horizons', title: 'Nuevos horizontes', theme: 'mountain' as const },
];
export const LEVELS_PER_UNIT = 4;
// Units follow the actual catalog. Appending vocabulary levels requires no screen changes.
export function buildJourneyUnits(catalog = levels): JourneyUnit[] {
  return Array.from({ length: Math.ceil(catalog.length / LEVELS_PER_UNIT) }, (_, index) => {
    const unit = definitions[index];
    return { key: unit?.key ?? `unit-${index + 1}`, title: unit?.title ?? `Destino ${index + 1}`, number: index + 1,
      data: catalog.slice(index * LEVELS_PER_UNIT, (index + 1) * LEVELS_PER_UNIT).map((level, i) => {
        if (level.indices.some(word => !vocabulary[word])) throw new Error(`Invalid journey vocabulary: ${level.id}`);
        return { id: level.id, sourceId: level.id, title: level.title, number: index * LEVELS_PER_UNIT + i + 1, theme: unit?.theme ?? definitions[index % definitions.length].theme };
      }),
    };
  });
}
export const journeyUnits = buildJourneyUnits();
// Local pages today; a future repository can implement this same cursor contract.
export function readJourneyPage(cursor = 0, size = 2): { units: JourneyUnit[]; nextCursor: number | null } {
  if (!Number.isInteger(cursor) || cursor < 0 || !Number.isInteger(size) || size < 1) throw new RangeError('Invalid journey page');
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
      number: unit * 20 + i + 1, title: i % 7 === 0 ? 'Un título de nivel muy largo para comprobar la adaptación del boleto' : levels[i % levels.length].title,
      theme: 'coast' as const, development: true })),
  }));
}
