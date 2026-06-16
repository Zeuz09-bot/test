import { create } from 'zustand';
import db from '../db/client';
import { enqueueSync } from '../sync/queue';
import type { Note } from '../types/note';

interface NoteState {
  notes: Note[];
  loadNotes: () => Promise<void>;
  createNote: (data: Omit<Note, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>) => Promise<Note>;
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
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO notes (id, user_id, goal_id, task_id, content, reminder_at, reminder_sent, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.user_id,
        data.goal_id ?? null,
        data.task_id ?? null,
        data.content,
        data.reminder_at ?? null,
        0,
        now,
        now,
      ]
    );
    await enqueueSync('INSERT', 'notes', id, { id, user_id: data.user_id, ...data, created_at: now, updated_at: now });
    await get().loadNotes();
    return { id, user_id: data.user_id, ...data, created_at: now, updated_at: now, deleted_at: null, synced_at: null } as Note;
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