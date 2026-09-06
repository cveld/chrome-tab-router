import { describe, expect, it } from 'vitest';
import { formatDateTime } from './format';

describe('formatDateTime', () => {
  it('returns an empty string for missing timestamps', () => {
    expect(formatDateTime(undefined)).toBe('');
    expect(formatDateTime(0)).toBe('');
  });

  it('formats as yyyy-MM-dd HH:mm:ss in local time', () => {
    // 2026-03-01 07:05:09 local time.
    const timestamp = new Date(2026, 2, 1, 7, 5, 9).getTime();
    expect(formatDateTime(timestamp)).toBe('2026-03-01 07:05:09');
  });
});
