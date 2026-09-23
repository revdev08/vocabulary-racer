/** Opt-in web diagnostics. Frame intervals measure scheduling, not GPU completion. */
export type FrameProfile = { warmupMs: number; elapsedMs: number; count: number; intervals: number[]; engine: number[]; complete: boolean };
export type FrameReport = { frames: number; seconds: number; intervalP50: number; intervalP95: number; intervalMax: number;
  over25Ms: number; over50Ms: number; engineP95: number; engineMax: number };

export function newFrameProfile(): FrameProfile {
  return { warmupMs: 0, elapsedMs: 0, count: 0, intervals: Array(512).fill(0), engine: Array(512).fill(0), complete: false };
}

export function frameReport(profile: FrameProfile): FrameReport {
  const intervals = profile.intervals.slice(0, profile.count).sort((a, b) => a - b);
  const engine = profile.engine.slice(0, profile.count).sort((a, b) => a - b);
  const percentile = (values: number[], fraction: number) => +(values[Math.min(values.length - 1, Math.floor(values.length * fraction))] ?? 0).toFixed(2);
  return { frames: profile.count, seconds: +(profile.elapsedMs / 1000).toFixed(2), intervalP50: percentile(intervals, .5),
    intervalP95: percentile(intervals, .95), intervalMax: percentile(intervals, 1),
    over25Ms: intervals.filter(t => t > 25).length, over50Ms: intervals.filter(t => t > 50).length,
    engineP95: percentile(engine, .95), engineMax: percentile(engine, 1) };
}
