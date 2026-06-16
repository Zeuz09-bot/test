export interface Note {
  id: string;
  user_id: string;
  goal_id?: string | null;
  task_id?: string | null;
  content: string;
  reminder_at?: string | null;
  reminder_sent: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  synced_at?: string | null;
}

export type CreateNoteInput = Omit<Note, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>;