import test from 'node:test';
import assert from 'node:assert/strict';
import { formatRelativeTime, formatMatchScore, getInitials } from '../utils/formatting.ts';

test('getInitials should extract initials from full name correctly', () => {
  assert.equal(getInitials('Moh. Rifqi Dwi Ardiansyah'), 'MA');
  assert.equal(getInitials('Hakim'), 'HA');
  assert.equal(getInitials('Dr. Ir. Budi Santoso, M.Kom'), 'DM');
  assert.equal(getInitials(''), '?');
  assert.equal(getInitials(null), '?');
});

test('formatMatchScore should format percentage properly', () => {
  assert.equal(formatMatchScore(0.88), '88%');
  assert.equal(formatMatchScore(0.954), '95%');
  assert.equal(formatMatchScore(1.0), '100%');
  assert.equal(formatMatchScore(85), '85%');
  assert.equal(formatMatchScore(null), '0%');
});

test('formatRelativeTime should return reasonable relative strings', () => {
  const now = new Date();
  assert.equal(formatRelativeTime(now.toISOString()), 'Baru saja');

  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  assert.equal(formatRelativeTime(fiveMinutesAgo.toISOString()), '5m lalu');

  const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
  assert.equal(formatRelativeTime(twoHoursAgo.toISOString()), '2j lalu');

  const threeDaysAgo = new Date(now.getTime() - 3 * 86400 * 1000);
  assert.equal(formatRelativeTime(threeDaysAgo.toISOString()), '3h lalu');

  assert.equal(formatRelativeTime(''), '');
  assert.equal(formatRelativeTime(null), '');
});
