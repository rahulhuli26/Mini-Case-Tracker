import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionStatus } from '../src/lib/status.js';

test('allows valid flow progression', () => {
  assert.equal(canTransitionStatus('New', 'Assigned'), true);
  assert.equal(canTransitionStatus('Assigned', 'In Progress'), true);
  assert.equal(canTransitionStatus('In Progress', 'Submitted'), true);
  assert.equal(canTransitionStatus('Submitted', 'Cleared'), true);
  assert.equal(canTransitionStatus('Submitted', 'Discrepant'), true);
});

test('rejects invalid transitions', () => {
  assert.equal(canTransitionStatus('Submitted', 'Assigned'), false);
  assert.equal(canTransitionStatus('New', 'Cleared'), false);
  assert.equal(canTransitionStatus('Cleared', 'In Progress'), false);
});
