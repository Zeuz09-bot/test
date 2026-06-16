import { calculateStreak } from '../../../src/utils/streaks';
import type { HabitLog } from '../../../src/types/habit';

describe('Streak Calculation Utility', () => {
  it('should return 0 when logs are empty', () => {
    const logs: HabitLog[] = [];
    const today = '2026-06-16';
    expect(calculateStreak(logs, today)).toBe(0);
  });

  it('should return correct streak when user has completed today and previous days', () => {
    const logs: HabitLog[] = [
      { id: '1', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-16', completed: 1, created_at: '2026-06-16T12:00:00Z' },
      { id: '2', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-15', completed: 1, created_at: '2026-06-15T12:00:00Z' },
      { id: '3', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-14', completed: 1, created_at: '2026-06-14T12:00:00Z' },
    ];
    const today = '2026-06-16';
    expect(calculateStreak(logs, today)).toBe(3);
  });

  it('should return correct streak when user has completed yesterday but not today yet', () => {
    const logs: HabitLog[] = [
      { id: '2', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-15', completed: 1, created_at: '2026-06-15T12:00:00Z' },
      { id: '3', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-14', completed: 1, created_at: '2026-06-14T12:00:00Z' },
    ];
    const today = '2026-06-16';
    expect(calculateStreak(logs, today)).toBe(2);
  });

  it('should reset streak to 0 if a gap exists', () => {
    const logs: HabitLog[] = [
      { id: '1', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-16', completed: 1, created_at: '2026-06-16T12:00:00Z' },
      // Missed 2026-06-15
      { id: '3', habit_id: 'h1', user_id: 'u1', log_date: '2026-06-14', completed: 1, created_at: '2026-06-14T12:00:00Z' },
    ];
    const today = '2026-06-16';
    expect(calculateStreak(logs, today)).toBe(1);
  });
});