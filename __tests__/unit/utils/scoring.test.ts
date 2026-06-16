import { computeDayScore } from '../../../src/utils/scoring';

describe('Scoring Utility', () => {
  it('should return 0 when all inputs are 0', () => {
    const input = {
      tasksTotal: 0,
      tasksCompleted: 0,
      habitsTotal: 0,
      habitsCompleted: 0,
      focusMinutes: 0,
    };
    expect(computeDayScore(input)).toBe(0);
  });

  it('should return 100 on perfect day', () => {
    const input = {
      tasksTotal: 5,
      tasksCompleted: 5,
      habitsTotal: 4,
      habitsCompleted: 4,
      focusMinutes: 120, // 2 hours
    };
    expect(computeDayScore(input)).toBe(100);
  });

  it('should handle zero tasks / zero habits gracefully (neutral scoring)', () => {
    const input = {
      tasksTotal: 0,
      tasksCompleted: 0,
      habitsTotal: 0,
      habitsCompleted: 0,
      focusMinutes: 60, // 1 hour focus = 7.5 focus points
    };
    // Expected task default = 25, habit default = 17.5. Total score = 25 + 17.5 + 7.5 = 50
    expect(computeDayScore(input)).toBe(50);
  });
});