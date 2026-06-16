import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import type { Goal } from '../types/goal';

interface GoalState {
  goals: Goal[];
  loadGoals: () => Promise<void>;
  createGoal: (data: Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>) => Promise<Goal>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  recomputeGoalProgress: (goalId: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loadGoals: async () => {
    const rows = await db.getAllAsync<Goal>(
      `SELECT * FROM goals WHERE deleted_at IS NULL ORDER BY updated_at DESC`
    );
    set({ goals: rows });
  },
  createGoal: async (data) => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO goals (id, user_id, title, category, target_date, progress_pct, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.user_id, data.title, data.category, data.target_date ?? null, data.progress_pct ?? 0, data.status ?? 'active', data.notes ?? null, now, now]
    );
    await enqueueSync('INSERT', 'goals', id, { id, user_id: data.user_id, ...data, created_at: now, updated_at: now });
    await get().loadGoals();
    return { id, user_id: data.user_id, ...data, created_at: now, updated_at: now, deleted_at: null, synced_at: null } as Goal;
  },
  updateGoal: async (id, data) => {
    const now = new Date().toISOString();
    const updates = Object.entries(data).map(([key]) => `${key} = ?`).join(', ');
    const values = Object.values(data).concat(id, now);
    await db.runAsync(`UPDATE goals SET ${updates}, updated_at = ? WHERE id = ?`, values);
    await enqueueSync('UPDATE', 'goals', id, { id, ...data, updated_at: now });
    await get().loadGoals();
  },
  deleteGoal: async (id) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE goals SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    await enqueueSync('DELETE', 'goals', id, { id, deleted_at: now, updated_at: now });
    await get().loadGoals();
  },
  recomputeGoalProgress: async (goalId) => {
    const result = await db.getFirstAsync<{ total: number; completed: number }>(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
       FROM tasks
       WHERE goal_id = ? AND deleted_at IS NULL`,
      [goalId]
    );
    const pct = result?.total > 0 ? Math.round((result.completed / result.total) * 100) : 0;
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE goals SET progress_pct = ?, updated_at = ? WHERE id = ?`, [pct, now, goalId]);
    await enqueueSync('UPDATE', 'goals', goalId, { id: goalId, progress_pct: pct, updated_at: now });
    await get().loadGoals();
  },
}));