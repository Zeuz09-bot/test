import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import type { FocusSession } from '../types/focus';

interface FocusState {
  activeSession: FocusSession | null;
  sessions: FocusSession[];
  startSession: (input: Omit<FocusSession, 'id' | 'created_at' | 'synced_at'>) => Promise<void>;
  endSession: (sessionId: string) => Promise<void>;
  loadSessions: () => Promise<void>;
}

export const useFocusStore = create<FocusState>((set, get) => ({
  activeSession: null,
  sessions: [],
  startSession: async (input) => {
    const session: FocusSession = {
      ...input,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      completed: 0,
    };
    await db.runAsync(
      `INSERT INTO focus_sessions (id, task_id, user_id, session_type, started_at, planned_minutes, completed_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [session.id, session.task_id, session.user_id, session.session_type, session.started_at, session.planned_minutes, null, session.created_at]
    );
    await enqueueSync('INSERT', 'focus_sessions', session.id, { ...session, created_at: session.created_at });
    set({ activeSession: session });
  },
  endSession: async (sessionId) => {
    const session = await db.getFirstAsync<FocusSession>(
      `SELECT * FROM focus_sessions WHERE id = ?`,
      [sessionId]
    );
    if (!session) return;
    const now = new Date().toISOString();
    const startTime = new Date(session.started_at).getTime();
    const actualMinutes = Math.round((Date.now() - startTime) / 60000);
    await db.runAsync(
      `UPDATE focus_sessions SET ended_at = ?, actual_minutes = ?, completed = 1, updated_at = ? WHERE id = ?`,
      [now, actualMinutes, now, session.id]
    );
    await enqueueSync('UPDATE', 'focus_sessions', session.id, { ...session, ended_at: now, completed: 1, updated_at: now });
    set({ activeSession: null });
  },
  loadSessions: async () => {
    const rows = await db.getAllAsync<FocusSession>(`SELECT * FROM focus_sessions ORDER BY started_at DESC`);
    set({ sessions: rows });
  },
}));