import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import { useAuthStore } from './authStore';
import type { Note, CreateNoteInput } from '../types/note';

interface NoteState {
  notes: Note[];
  loadNotes: () => Promise<void>;
  createNote: (data: CreateNoteInput) => Promise<Note>;
  updateNote: (id: string, data: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  convertNoteToTask: (noteId: string) => Promise<void>;
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  loadNotes: async () => {
    const rows = await db.getAllAsync<Note>(
      `SELECT * FROM notes WHERE deleted_at IS NULL ORDER BY created_at DESC`
    );
    set({ notes: rows });
  },
  createNote: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) throw new Error('Not authenticated');
    const userId = user.id;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO notes (id, user_id, goal_id, task_id, content, reminder_at, reminder_sent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        data.goal_id ?? null,
        data.task_id ?? null,
        data.content,
        data.reminder_at ?? null,
        0,
        now,
        now,
      ]
    );
    const { user_id: _uid, ...rest } = data;
    void _uid;
    await enqueueSync('INSERT', 'notes', id, { id, user_id: userId, ...rest, created_at: now, updated_at: now });
    await get().loadNotes();
    return { id, user_id: userId, ...rest, created_at: now, updated_at: now, deleted_at: null, synced_at: null } as Note;
  },
  updateNote: async (id, data) => {
    const now = new Date().toISOString();
    const updates = Object.entries(data).map(([key]) => `${key} = ?`).join(', ');
    const values = Object.values(data).concat(id, now);
    await db.runAsync(`UPDATE notes SET ${updates}, updated_at = ? WHERE id = ?`, values);
    await enqueueSync('UPDATE', 'notes', id, { id, ...data, updated_at: now });
    await get().loadNotes();
  },
  deleteNote: async (id) => {
    const now = new Date().toISOString();
    await db.runAsync(`UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ?`, [now, now, id]);
    await enqueueSync('DELETE', 'notes', id, { id, deleted_at: now, updated_at: now });
    await get().loadNotes();
  },
  convertNoteToTask: async (noteId) => {
    const note = await db.getFirstAsync<Note>(`SELECT * FROM notes WHERE id = ?`, [noteId]);
    if (!note) return;
    const taskId = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO tasks (id, user_id, goal_id, title, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [taskId, note.user_id, note.goal_id ?? null, note.content, null, now, now]
    );
    await enqueueSync('INSERT', 'tasks', taskId, {
      id: taskId,
      user_id: note.user_id,
      goal_id: note.goal_id,
      title: note.content,
      description: null,
      created_at: now,
      updated_at: now,
    });
    await get().loadNotes();
  },
}));