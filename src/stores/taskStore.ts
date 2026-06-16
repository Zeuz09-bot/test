import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import { useAuthStore } from './authStore';
import type { Task, CreateTaskInput } from '../types/task';

interface TaskState {
  tasks: Task[];
  todaysTasks: Task[];
  overdueTasks: Task[];
  loadTasks: () => Promise<void>;
  createTask: (data: CreateTaskInput) => Promise<Task>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  scheduleTask: (id: string, date: string, startTime?: string) => Promise<void>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  todaysTasks: [],
  overdueTasks: [],
  loadTasks: async () => {
    const rows = await db.getAllAsync<Task>(
      `SELECT * FROM tasks WHERE deleted_at IS NULL ORDER BY
         CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
         deadline ASC NULLS LAST`
    );
    const today = new Date().toISOString().split('T')[0];
    set({
      tasks: rows,
      todaysTasks: rows.filter((t) => t.scheduled_date === today),
      overdueTasks: rows.filter((t) => t.deadline != null && t.deadline < today && t.status !== 'completed'),
    });
  },
  createTask: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO tasks (id, user_id, title, description, priority, status, deadline, scheduled_date, scheduled_start_time, estimated_minutes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.title, data.description ?? null, data.priority ?? 'medium', data.status ?? 'pending', data.deadline ?? null, data.scheduled_date ?? null, data.scheduled_start_time ?? null, data.estimated_minutes ?? null, now, now]
    );
    const { user_id: _uid, ...rest } = data;
    void _uid;
    await enqueueSync('INSERT', 'tasks', id, { id, user_id: userId, ...rest, created_at: now, updated_at: now });
    await get().loadTasks();
    return { id, user_id: userId, ...rest, created_at: now, updated_at: now, deleted_at: null, synced_at: null } as Task;
  },
  updateTask: async (id, data) => {
    const now = new Date().toISOString();
    const updates = Object.entries(data).map(([key]) => `${key} = ?`).join(', ');
    const values = Object.values(data).concat(id, now);
    await db.runAsync(`UPDATE tasks SET ${updates}, updated_at = ? WHERE id = ?`, values);
    await enqueueSync('UPDATE', 'tasks', id, { id, ...data, updated_at: now });
    await get().loadTasks();
  },
  completeTask: async (id) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE tasks SET status = 'completed', completed_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    await enqueueSync('UPDATE', 'tasks', id, { id, status: 'completed', completed_at: now, updated_at: now });
    await get().loadTasks();
  },
  deleteTask: async (id) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    await enqueueSync('DELETE', 'tasks', id, { id, deleted_at: now, updated_at: now });
    await get().loadTasks();
  },
  scheduleTask: async (id, date, startTime) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE tasks SET scheduled_date = ?, scheduled_start_time = ?, updated_at = ? WHERE id = ?`, [date, startTime ?? null, now, id]);
    await enqueueSync('UPDATE', 'tasks', id, { id, scheduled_date: date, scheduled_start_time: startTime ?? null, updated_at: now });
    await get().loadTasks();
  },
}));