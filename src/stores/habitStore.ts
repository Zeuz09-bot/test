import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import { useAuthStore } from './authStore';
import { calculateStreak } from '../utils/streaks';
import type { Habit, HabitLog, CreateHabitInput } from '../types/habit';

interface HabitState {
  habits: Habit[];
  habitLogs: HabitLog[];
  loadHabits: () => Promise<void>;
  loadHabitLogs: () => Promise<void>;
  createHabit: (data: CreateHabitInput) => Promise<Habit>;
  updateHabit: (id: string, data: Partial<Habit>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  checkInHabit: (habitId: string, logDate: string) => Promise<void>;
  getTodayStreak: (habitId: string) => number;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  habitLogs: [],
  loadHabits: async () => {
    const rows = await db.getAllAsync<Habit>(
      `SELECT * FROM habits WHERE deleted_at IS NULL ORDER BY sort_order ASC`
    );
    set({ habits: rows });
  },
  loadHabitLogs: async () => {
    const rows = await db.getAllAsync<HabitLog>(
      `SELECT * FROM habit_logs ORDER BY log_date DESC`
    );
    set({ habitLogs: rows });
  },
  createHabit: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO habits (id, user_id, title, frequency, custom_days, reminder_time, current_streak, longest_streak, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.title, data.frequency ?? 'daily', data.custom_days ?? null, data.reminder_time ?? null, 0, 0, data.sort_order ?? 0, now, now]
    );
    await enqueueSync('INSERT', 'habits', id, { id, user_id: userId, ...data, created_at: now, updated_at: now });
    await get().loadHabits();
    return { id, user_id: userId, ...data, created_at: now, updated_at: now, deleted_at: null, synced_at: null } as Habit;
  },
  updateHabit: async (id, data) => {
    const now = new Date().toISOString();
    const updates = Object.entries(data).map(([key]) => `${key} = ?`).join(', ');
    const values = Object.values(data).concat(id, now);
    await db.runAsync(`UPDATE habits SET ${updates}, updated_at = ? WHERE id = ?`, values);
    await enqueueSync('UPDATE', 'habits', id, { id, ...data, updated_at: now });
    await get().loadHabits();
  },
  deleteHabit: async (id) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE habits SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    await enqueueSync('DELETE', 'habits', id, { id, deleted_at: now, updated_at: now });
    await get().loadHabits();
  },
  checkInHabit: async (habitId, logDate) => {
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT OR REPLACE INTO habit_logs (id, habit_id, user_id, log_date, completed, completed_at, created_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      [crypto.randomUUID(), habitId, (await db.getFirstAsync<{ user_id: string }>(`SELECT user_id FROM habits WHERE id = ?`, [habitId])).user_id, logDate, now, now]
    );
    await enqueueSync('INSERT', 'habit_logs', crypto.randomUUID(), { habit_id: habitId, log_date: logDate, completed: 1, completed_at: now, created_at: now });
    await get().loadHabitLogs();
  },
  getTodayStreak: (habitId) => {
    const logs = get().habitLogs.filter((l) => l.habit_id === habitId);
    return calculateStreak(logs, new Date().toISOString().split('T')[0]);
  },
}));