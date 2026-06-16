import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import { computeDayScore } from '../utils/scoring';
import type { DayReview } from '../types/review';

interface ReviewState {
  review: DayReview | null;
  loadReview: (date: string) => Promise<void>;
  saveReview: (input: Omit<DayReview, 'id' | 'user_id' | 'created_at' | 'synced_at'>) => Promise<void>;
}

export const useReviewStore = create<ReviewState>((set, get) => ({
  review: null,
  loadReview: async (date) => {
    const row = await db.getFirstAsync<DayReview>(
      `SELECT * FROM day_reviews WHERE review_date = ?`,
      [date]
    );
    set({ review: row });
  },
  saveReview: async (input) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const score = computeDayScore({
      tasksTotal: input.tasks_total,
      tasksCompleted: input.tasks_completed,
      habitsTotal: input.habits_total,
      habitsCompleted: input.habits_completed,
      focusMinutes: input.focus_minutes,
    });
    const row = { ...input, id, score, created_at: now };
    await db.runAsync(
      `INSERT INTO day_reviews (id, user_id, review_date, tasks_total, tasks_completed, habits_total, habits_completed, focus_minutes, focus_sessions, score, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, input.user_id, input.review_date, input.tasks_total, input.tasks_completed, input.habits_total, input.habits_completed, input.focus_minutes, input.focus_sessions, score, input.notes ?? null, now]
    );
    await enqueueSync('INSERT', 'day_reviews', id, row);
    set({ review: row });
  },
}));