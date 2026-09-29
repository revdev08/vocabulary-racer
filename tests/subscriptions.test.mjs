import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccessRequest, hasPlus } from '../src/subscriptions/access.ts';
const inactive = { entitlements: { active: {} } };
const active = { entitlements: { active: { plus: { isActive: true } } } };
test('trial or paid plus grants access; other products and expired plus do not', () => {
  assert.equal(hasPlus(active), true);
  assert.equal(hasPlus(null), false);
  assert.equal(hasPlus({ entitlements: { active: { other: { isActive: true }, plus: { isActive: false } } } }), false);
});
test('subscriber skips paywall', async () => {
  const enter = createAccessRequest({ read: async () => active, present: async () => assert.fail('must not present') });
  assert.equal(await enter(), true);
});
test('cancelled or pending purchase cannot grant access', async () => {
  let displays = 0;
  const enter = createAccessRequest({ read: async () => inactive, present: async () => { displays++; } });
  assert.equal(await enter(), false);
  assert.equal(displays, 1);
});
test('purchase or restoration unlocks only after new customer info, duplicate taps share one flow', async () => {
  let current = inactive, displays = 0;
  const enter = createAccessRequest({ read: async () => current, present: async () => { displays++; current = active; } });
  assert.deepEqual(await Promise.all([enter(), enter()]), [true, true]);
  assert.equal(displays, 1);
});
test('network error stays closed and allows retry; expiry is checked on each new race', async () => {
  let current = active, fail = true;
  const enter = createAccessRequest({ read: async () => { if (fail) throw new Error('offline'); return current; }, present: async () => {} });
  await assert.rejects(enter(), /offline/);
  fail = false;
  assert.equal(await enter(), true);
  current = inactive;
  assert.equal(await enter(), false);
});
