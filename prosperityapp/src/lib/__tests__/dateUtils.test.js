import { describe, it, expect } from 'vitest';
import { parseDate, toISODateStr, formatDateCL, isInRange } from '../dateUtils';

describe('dateUtils', () => {
  describe('parseDate', () => {
    it('should parse an ISO string to Date', () => {
      const dateStr = '2024-12-01T12:00:00Z';
      const parsed = parseDate(dateStr);
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.toISOString()).toBe('2024-12-01T12:00:00.000Z');
    });

    it('should parse a number timestamp (milliseconds)', () => {
      const ms = new Date('2024-12-01T12:00:00Z').getTime();
      const parsed = parseDate(ms);
      expect(parsed.toISOString()).toBe('2024-12-01T12:00:00.000Z');
    });

    it('should parse a number timestamp (seconds)', () => {
      const sec = Math.floor(new Date('2024-12-01T12:00:00Z').getTime() / 1000);
      const parsed = parseDate(sec);
      expect(parsed.toISOString()).toBe('2024-12-01T12:00:00.000Z');
    });

    it('should handle Date objects directly', () => {
      const date = new Date('2024-12-01T12:00:00Z');
      expect(parseDate(date)).toBe(date);
    });

    it('should return epoch 0 for falsy values', () => {
      expect(parseDate(null).getTime()).toBe(0);
      expect(parseDate(undefined).getTime()).toBe(0);
      expect(parseDate('').getTime()).toBe(0); // empty string parsed to Date might be Invalid, but fn returns new Date(value) -> Invalid Date. Wait, let's see.
    });

    it('should parse legacy Firestore timestamp with seconds', () => {
      const fsTimestamp = { seconds: 1733054400, nanoseconds: 0 }; // 2024-12-01T12:00:00Z
      const parsed = parseDate(fsTimestamp);
      expect(parsed.toISOString()).toBe('2024-12-01T12:00:00.000Z');
    });

    it('should parse legacy Firestore timestamp with toDate()', () => {
      const d = new Date('2024-12-01T12:00:00Z');
      const fsTimestamp = { toDate: () => d };
      const parsed = parseDate(fsTimestamp);
      expect(parsed).toBe(d);
    });
  });

  describe('toISODateStr', () => {
    it('should format to YYYY-MM-DD', () => {
      expect(toISODateStr('2024-12-01T12:34:56Z')).toBe('2024-12-01');
    });
  });

  describe('formatDateCL', () => {
    it('should format to DD-MM-YYYY', () => {
      // locale is es-CL, so new Date('2024-12-01T12:00:00Z') in GMT-something could be different day
      // But let's assume UTC to not be flaky
      const date = new Date(Date.UTC(2024, 11, 1, 12, 0, 0)); // Month is 11 for Dec
      // Vitest runs in system timezone. We mock locale string or just check if it matches regex DD-MM-YYYY
      const formatted = formatDateCL(date);
      expect(formatted).toMatch(/^\d{1,2}-\d{1,2}-\d{4}$/);
    });

    it('should return N/A for falsy value', () => {
      expect(formatDateCL(null)).toBe('N/A');
    });
  });

  describe('isInRange', () => {
    it('should return true if date is within range', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-12-31T23:59:59Z');
      const value = '2024-05-15T12:00:00Z';
      
      expect(isInRange(value, start, end)).toBe(true);
    });

    it('should return false if date is outside range', () => {
      const start = new Date('2024-01-01T00:00:00Z');
      const end = new Date('2024-12-31T23:59:59Z');
      
      expect(isInRange('2023-12-31T23:59:59Z', start, end)).toBe(false);
      expect(isInRange('2025-01-01T00:00:00Z', start, end)).toBe(false);
    });
  });
});
