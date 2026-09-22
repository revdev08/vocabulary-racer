import AsyncStorage from '@react-native-async-storage/async-storage';
import { Race, Reviews, scheduleReviews } from './engine';
export type Progress = { version: 1; best: number; races: number; recentIds: string[]; practice: string[]; reviews: Reviews };
const KEY = 'vocab-racer:progress:v1';
const empty = (): Progress => ({ version: 1, best: 0, races: 0, recentIds: [], practice: [], reviews: {} });
export async function readProgress(): Promise<Progress> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return empty();
  const data = JSON.parse(raw);
  if (data.version !== 1 || !Number.isFinite(data.best) || !Number.isFinite(data.races) || !Array.isArray(data.recentIds) || !Array.isArray(data.practice)) return empty();
  const reviews: Reviews = {};
  for (const [id, value] of Object.entries(data.reviews ?? {})) {
    const r = value as Reviews[string];
    if (r && Number.isFinite(r.dueAt) && Number.isInteger(r.stage) && r.stage >= 0 && r.stage <= 4 && Number.isFinite(r.lapses)) reviews[id] = r;
  }
  for (const id of data.practice) if (typeof id === 'string' && !reviews[id]) reviews[id] = { dueAt: 0, stage: 0, lapses: 1 };
  return { ...data, reviews } as Progress;
}
let queue = Promise.resolve();
export function saveRace(race: Race): Promise<void> {
  const job = queue.catch(() => {}).then(async () => {
    if (race.phase !== 'finished') return;
    const progress = await readProgress();
    if (progress.recentIds.includes(race.id)) return;
    const reviews = scheduleReviews(progress.reviews, race.answers);
    const practice = Object.keys(reviews).filter(id => reviews[id].stage === 0);
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: 1, best: Math.max(progress.best, race.score), races: progress.races + 1,
      recentIds: [...progress.recentIds, race.id].slice(-100), practice, reviews } satisfies Progress));
  });
  queue = job; return job;
}
