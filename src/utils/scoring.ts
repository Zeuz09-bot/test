export interface DayScoreInput {
  tasksTotal: number;
  tasksCompleted: number;
  habitsTotal: number;
  habitsCompleted: number;
  focusMinutes: number;
}

export function computeDayScore(input: DayScoreInput): number {
  if (input.tasksTotal === 0 && input.habitsTotal === 0 && input.focusMinutes === 0) {
    return 0;
  }

  // Task score: 50% weight. If no tasks, we give a neutral 25 points.
  const taskWeight = 50;
  const taskScore = input.tasksTotal > 0
    ? (input.tasksCompleted / input.tasksTotal) * taskWeight
    : 25;

  // Habit score: 35% weight. If no habits, we give a neutral 17.5 points.
  const habitWeight = 35;
  const habitScore = input.habitsTotal > 0
    ? (input.habitsCompleted / input.habitsTotal) * habitWeight
    : 17.5;

  // Focus score: 15% weight. Capped at 120 minutes (2 hours).
  const focusWeight = 15;
  const focusScore = Math.min(input.focusMinutes / 120, 1) * focusWeight;

  return Math.round(taskScore + habitScore + focusScore);
}