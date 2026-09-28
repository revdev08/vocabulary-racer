import { levels, vocabulary } from './vocabulary';
import { journeyMapCycle, type MapId } from '../config/maps';
import type { LevelRecords } from '../gameplay/curriculum';

export type JourneyLevel = { id: string; sourceId: string; title: string; number: number; theme: MapId; development?: boolean };
export type JourneyUnit = { key: string; title: string; number: number; category?: string; data: JourneyLevel[] };
export const vocabularyGroups = levels.map(level => ({ id: level.id, indices: level.indices }));
const definitions = [
  { key: 'departure', title: 'Primeros kilómetros', theme: 'coast' as const },
  { key: 'everyday', title: 'Vida cotidiana', theme: 'city' as const },
  { key: 'horizons', title: 'Nuevos horizontes', theme: 'mountain' as const },
];
export const LEVELS_PER_UNIT = 4;
// Units follow the actual catalog. Appending vocabulary levels requires no screen changes.
export function buildJourneyUnits(catalog = levels): JourneyUnit[] {
  const units: JourneyUnit[] = [];
  const parts = new Map<string, number>();
  for (let start = 0; start < catalog.length;) {
    const first = catalog[start];
    let end = start + 1;
    while (end < catalog.length && end - start < LEVELS_PER_UNIT && catalog[end].topicId === first.topicId) end++;
    const index = units.length;
    const unit = start < 12 && !first.topicId ? definitions[index] : undefined;
    const part = (parts.get(first.topicId ?? 'legacy') ?? 0) + 1;
    parts.set(first.topicId ?? 'legacy', part);
    units.push({ key: first.topicId ? `${first.topicId}-${part}` : unit?.key ?? `unit-${index + 1}`,
      title: first.topicTitle ? `${first.topicTitle}${part > 1 ? ` · Etapa ${part}` : ''}` : unit?.title ?? `Destino ${index + 1}`,
      category: first.category, number: index + 1,
      data: catalog.slice(start, end).map((level, i) => {
        if (level.indices.some(word => !vocabulary[word])) throw new Error(`Invalid journey vocabulary: ${level.id}`);
        return { id: level.id, sourceId: level.id, title: level.title, number: start + i + 1, theme: unit?.theme ?? journeyMapCycle[index % journeyMapCycle.length] };
      }),
    });
    start = end;
  }
  return units;
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
