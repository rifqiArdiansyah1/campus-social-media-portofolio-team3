import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  formatMatchScore,
  getInitials,
} from '../../../mobile/src/utils/formatting';

describe('Mobile App Formatting & Utility Tests (M12)', () => {
  it('extracts initials from full names properly', () => {
    expect(getInitials('Moh. Rifqi Dwi Ardiansyah')).toBe('MA');
    expect(getInitials('Hakim')).toBe('HA');
    expect(getInitials('Dr. Ir. Budi Santoso, M.Kom')).toBe('DM');
    expect(getInitials('')).toBe('?');
    expect(getInitials(null)).toBe('?');
  });

  it('formats match scores into percentages correctly', () => {
    expect(formatMatchScore(0.88)).toBe('88%');
    expect(formatMatchScore(0.954)).toBe('95%');
    expect(formatMatchScore(1.0)).toBe('100%');
    expect(formatMatchScore(85)).toBe('85%');
    expect(formatMatchScore(null)).toBe('0%');
  });

  it('formats relative timestamps accurately', () => {
    const now = new Date();
    expect(formatRelativeTime(now.toISOString())).toBe('Baru saja');

    const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000);
    expect(formatRelativeTime(fiveMinAgo.toISOString())).toBe('5m lalu');

    const twoHoursAgo = new Date(now.getTime() - 2 * 3600 * 1000);
    expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe('2j lalu');

    const threeDaysAgo = new Date(now.getTime() - 3 * 86400 * 1000);
    expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3h lalu');

    expect(formatRelativeTime('')).toBe('');
    expect(formatRelativeTime(null)).toBe('');
  });
});
