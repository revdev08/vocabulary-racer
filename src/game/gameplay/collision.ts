/** Swept rectangles in world coordinates, including lateral motion. */
export function sweptContact(x0: number, x1: number, z0: number, z1: number,
  halfWidth: number, front: number, rear: number) {
  'worklet';
  let enter = 0, leave = 1;
  const starts = [x0, z0], ends = [x1, z1], mins = [-halfWidth, -front], maxs = [halfWidth, rear];
  for (let axis = 0; axis < 2; axis++) {
    const delta = ends[axis] - starts[axis];
    if (Math.abs(delta) < 1e-10) {
      if (starts[axis] < mins[axis] || starts[axis] > maxs[axis]) return false;
    } else {
      const a = (mins[axis] - starts[axis]) / delta, b = (maxs[axis] - starts[axis]) / delta;
      enter = Math.max(enter, Math.min(a, b)); leave = Math.min(leave, Math.max(a, b));
      if (enter > leave) return false;
    }
  }
  return true;
}
