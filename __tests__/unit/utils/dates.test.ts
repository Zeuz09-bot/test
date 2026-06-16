import { getPreviousDayDateString, getNextDayDateString } from '../../../src/utils/dates';

describe('Date Utilities', () => {
  it('should return the previous day correctly', () => {
    expect(getPreviousDayDateString('2026-06-16')).toBe('2026-06-15');
    expect(getPreviousDayDateString('2026-03-01')).toBe('2026-02-28');
  });

  it('should return the next day correctly', () => {
    expect(getNextDayDateString('2026-06-16')).toBe('2026-06-17');
    expect(getNextDayDateString('2026-02-28')).toBe('2026-03-01');
  });
});
