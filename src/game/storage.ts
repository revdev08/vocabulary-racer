import AsyncStorage from '@react-native-async-storage/async-storage';
import { Race } from './engine';
export type Progress = { version: 1; best: number; races: number; recentIds: string[]; practice: string[] };
const KEY = 'vocab-racer:progress:v1';
const empty = (): Progress => ({ version: 1, best: 0, races: 0, recentIds: [], practice: [] });
export async function readProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty();
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Number.isFinite(data.best) || !Number.isFinite(data.races) || !Array.isArray(data.recentIds) || !Array.isArray(data.practice)) return empty();
  return data as Progress;
}
let queue = Promise.resolve();
export function saveRace(race: Race): Promise<void> {
  const job = queue.catch(() => {}).then(async () => {
    if (race.phase !== 'finished') return;
    const progress = await readProgress();
    if (progress.recentIds.includes(race.id)) return;
    const practice = new Set(progress.practice);
    race.answers.filter(a => a.result !== 'correct').forEach(a => practice.add(a.wordId));
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, best: Math.max(progress.best, race.score), races: progress.races + 1,
      recentIds: [...progress.recentIds, race.id].slice(-100), practice: [...practice] } satisfies Progress));
  });
  queue = job; return job;
}
