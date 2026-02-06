import { describe, it, expect } from 'vitest';
import { calculateMaintenanceScore, formatBytes } from './utils';

describe('calculateMaintenanceScore', () => {
  it('should return 0 for just merged PR', () => {
    const now = new Date().toISOString();
    expect(calculateMaintenanceScore(now)).toBe(0);
  });

  it('should return correct number of days for older merge', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(calculateMaintenanceScore(tenDaysAgo)).toBe(10);
  });

  it('should return 999 if no merge date provided', () => {
    expect(calculateMaintenanceScore(null)).toBe(999);
  });
});

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1234567)).toBe('1.18 MB');
  });
});
