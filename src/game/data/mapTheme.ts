import { getMapTheme } from '../config/maps';
import { journeyUnits } from './journey';

const levelThemes = new Map(journeyUnits.flatMap(unit => unit.data.map(level => [level.sourceId, level.theme] as const)));
export function resolveMapTheme(levelId: string | undefined, review = false) {
  return getMapTheme(review ? 'city' : levelThemes.get(levelId ?? ''));
}
