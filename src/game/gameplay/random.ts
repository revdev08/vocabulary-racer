export function random(seed: number) {
  'worklet';
  const next = (seed * 48271) % 2147483647;
  return { seed: next, value: next / 2147483647 };
}
