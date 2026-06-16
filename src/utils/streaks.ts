import type { HabitLog } from '../types/habit';

function getPreviousDay(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const utcDate = new Date(Date.UTC(y, m - 1, d));
  utcDate.setUTCDate(utcDate.getUTCDate() - 1);
  return utcDate.toISOString().split('T')[0];
}

export function calculateStreak(logs: HabitLog[], today: string): number {
  const sorted = logs
    .filter((l) => l.completed)
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  if (sorted.length === 0) return 0;

  // Group unique dates to avoid duplicate logs on the same day inflating/breaking the streak
  const completedDates = new Set(sorted.map((l) => l.log_date));

  let streak = 0;
  let current = today;

  // If we checked in today, start counting from today
  if (completedDates.has(today)) {
    streak++;
    current = getPreviousDay(today);
  } else {
    // If not today, check if we checked in yesterday
    const yesterday = getPreviousDay(today);
    if (completedDates.has(yesterday)) {
      streak++;
      current = getPreviousDay(yesterday);
    }
  }

  // Count consecutive days backward
  if (streak > 0) {
    while (completedDates.has(current)) {
      streak++;
      current = getPreviousDay(current);
    }
  }

  return streak;
}