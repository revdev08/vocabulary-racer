import { test } from 'node:test';
import assert from 'node:assert/strict';
import { depthAt, encounterDepth, groundY, laneX, roadHalf, dividerSkew, SAMPLES } from '../src/game/perspective.ts';

test('encounter and vehicle share the same ground contact at evaluation', () => {
  assert.ok(Math.abs(encounterDepth(1) - .72) < 1e-9);
  for (const h of [568, 667, 812, 932]) assert.ok(Math.abs(groundY(h, encounterDepth(1)) - groundY(h, .72)) < 1e-9);
});
test('adjacent option plaques fit their lanes at mobile and desktop-preview sizes', () => {
  for (const width of [320, 375, 390, 520]) for (const t of SAMPLES) {
    const p = encounterDepth(t);
    const label = Math.min(110, width * .26) * (.54 + p * .62);
    const spacing = laneX(width, 1, p) - laneX(width, 0, p);
    assert.ok(label <= spacing, `overlapping labels at width ${width}, t ${t}`);
    assert.ok(laneX(width, 0, p) - label / 2 >= 0);
    assert.ok(laneX(width, 2, p) + label / 2 <= width);
    assert.equal(laneX(width, 1, p), width / 2);
    assert.ok(roadHalf(width, p) > spacing);
  }
});
test('projected motion accelerates smoothly toward the viewer and clamps endpoints', () => {
  assert.ok(depthAt(.9) - depthAt(.8) > depthAt(.2) - depthAt(.1));
  assert.equal(depthAt(-1), depthAt(0)); assert.equal(depthAt(2), depthAt(1));
  for (let i = 1; i < SAMPLES.length; i++) assert.ok(encounterDepth(SAMPLES[i]) > encounterDepth(SAMPLES[i - 1]));
});


test('both endpoints of every sheared dash stay on the lane divider', () => {
  for (const w of [320, 390, 520]) for (const h of [568, 812, 932]) for (const lateral of [-1/3, 1/3]) for (const p of [.15, .4, .8]) {
    const slope = Math.tan(dividerSkew(w, h, lateral) * Math.PI / 180);
    for (const dy of [-31 * p, 31 * p]) {
      const endpointX = w / 2 + lateral * roadHalf(w, p) + slope * dy;
      const endpointDepth = p + dy / (h * .72);
      assert.ok(Math.abs(endpointX - (w / 2 + lateral * roadHalf(w, endpointDepth))) < 1e-9);
    }
  }
});
