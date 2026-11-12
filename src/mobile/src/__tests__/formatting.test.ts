import { describe, it, expect } from 'vitest';
import {
  formatRelativeTime,
  formatMatchScore,
  getInitials,
  resolveMediaUrl,
} from '../utils/formatting';

describe('Mobile Formatting Utilities', () => {
  describe('formatRelativeTime', () => {
    it('returns empty string for empty, null, or invalid dates', () => {
      expect(formatRelativeTime(null)).toBe('');
      expect(formatRelativeTime(undefined)).toBe('');
      expect(formatRelativeTime('')).toBe('');
      expect(formatRelativeTime('invalid-date')).toBe('');
    });

    it('returns "Baru saja" for timestamps less than 60 seconds ago', () => {
      const now = new Date();
      expect(formatRelativeTime(now.toISOString())).toBe('Baru saja');
    });

    it('returns minutes ago format correctly', () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      expect(formatRelativeTime(tenMinutesAgo.toISOString())).toBe('10m lalu');
    });

    it('returns hours ago format correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 3600 * 1000);
      expect(formatRelativeTime(twoHoursAgo.toISOString())).toBe('2j lalu');
    });

    it('returns days ago format correctly', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 86400 * 1000);
      expect(formatRelativeTime(threeDaysAgo.toISOString())).toBe('3h lalu');
    });
  });

  describe('formatMatchScore', () => {
    it('handles null and undefined gracefully', () => {
      expect(formatMatchScore(null)).toBe('0%');
      expect(formatMatchScore(undefined)).toBe('0%');
    });

    it('formats decimal fraction to percentage string', () => {
      expect(formatMatchScore(0.85)).toBe('85%');
      expect(formatMatchScore(0.426)).toBe('43%');
      expect(formatMatchScore(1.0)).toBe('100%');
    });

    it('formats integer percentages correctly', () => {
      expect(formatMatchScore(75)).toBe('75%');
      expect(formatMatchScore(100)).toBe('100%');
    });

    it('clamps scores between 0% and 100%', () => {
      expect(formatMatchScore(-0.2)).toBe('0%');
      expect(formatMatchScore(150)).toBe('100%');
    });
  });

  describe('getInitials', () => {
    it('returns ? for missing name', () => {
      expect(getInitials(null)).toBe('?');
      expect(getInitials(undefined)).toBe('?');
      expect(getInitials('')).toBe('?');
    });

    it('extracts first two letters for single word names', () => {
      expect(getInitials('Budi')).toBe('BU');
      expect(getInitials('Al')).toBe('AL');
    });

    it('extracts first and last initials for multi-word names', () => {
      expect(getInitials('Ahmad Dahlan')).toBe('AD');
      expect(getInitials('Moh. Rifqi Dwi Ardiansyah')).toBe('MA');
    });
  });

  describe('resolveMediaUrl', () => {
    it('returns null for empty or null inputs', () => {
      expect(resolveMediaUrl(null)).toBeNull();
      expect(resolveMediaUrl(undefined)).toBeNull();
      expect(resolveMediaUrl('   ')).toBeNull();
    });

    it('preserves existing absolute URLs', () => {
      const httpsUrl = 'https://cdn.example.com/images/avatar.png';
      expect(resolveMediaUrl(httpsUrl)).toBe(httpsUrl);

      const httpUrl = 'http://external.site/image.jpg';
      expect(resolveMediaUrl(httpUrl)).toBe(httpUrl);
    });

    it('resolves relative paths against the host root', () => {
      const baseUrl = 'http://10.0.2.2:8000/api/v1';
      const relativePath = '/static/post-images/101/photo.jpg';
      expect(resolveMediaUrl(relativePath, baseUrl)).toBe(
        'http://10.0.2.2:8000/static/post-images/101/photo.jpg'
      );
    });

    it('handles paths missing leading slash', () => {
      const baseUrl = 'http://192.168.1.15:8000/api/v1/';
      const relativePath = 'static/post-images/101/photo.jpg';
      expect(resolveMediaUrl(relativePath, baseUrl)).toBe(
        'http://192.168.1.15:8000/static/post-images/101/photo.jpg'
      );
    });
  });
});
