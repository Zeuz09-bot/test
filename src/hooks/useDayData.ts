import { useEffect, useCallback } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useHabitStore } from '../stores/habitStore';
import { useGoalStore } from '../stores/goalStore';
import { useReviewStore } from '../stores/reviewStore';
import { useNoteStore } from '../stores/noteStore';
import { useFocusStore } from '../stores/focusStore';

export function useLoadDayData(date?: string) {
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const loadHabits = useHabitStore((s) => s.loadHabits);
  const loadHabitLogs = useHabitStore((s) => s.loadHabitLogs);
  const loadGoals = useGoalStore((s) => s.loadGoals);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const loadSessions = useFocusStore((s) => s.loadSessions);
  const loadReview = useReviewStore((s) => s.loadReview);

  const loadAll = useCallback(async () => {
    await Promise.all([
      loadTasks(),
      loadHabits(),
      loadHabitLogs(),
      loadGoals(),
      loadNotes(),
      loadSessions(),
    ]);
    if (date) {
      await loadReview(date);
    }
  }, [loadTasks, loadHabits, loadHabitLogs, loadGoals, loadNotes, loadSessions, loadReview, date]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);
}

export function useTodaysDate(): string {
  return new Date().toISOString().split('T')[0];
}
