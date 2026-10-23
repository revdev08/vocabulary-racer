import { test } from 'node:test';
import assert from 'node:assert/strict';
import { demoCodeMatches, demoIsValid, demoPolicy } from '../src/subscriptions/demoPolicy.ts';

test('accepts configured code with surrounding whitespace and mixed case only', () => {
  assert.equal(demoCodeMatches('  dashword-review-2026  '), true);
  for (const value of ['', 'DASHWORD', 'DASHWORD-REVIEW-2025']) assert.equal(demoCodeMatches(value), false);
});
test('saved activation expires exactly at midnight November 21 in Colombia', () => {
  assert.equal(demoIsValid(demoPolicy.revision, Date.parse('2026-11-20T23:59:59.999-05:00')), true);
  assert.equal(demoIsValid(demoPolicy.revision, Date.parse('2026-11-21T00:00:00-05:00')), false);
  assert.equal(demoIsValid(demoPolicy.revision, demoPolicy.expiresAt + 1), false);
});
test('missing, obsolete sessions and invalid clock values cannot unlock', () => {
  for (const value of [null, '', 'old-review']) assert.equal(demoIsValid(value, demoPolicy.expiresAt - 1), false);
  assert.equal(demoIsValid(demoPolicy.revision, NaN), false);
});
