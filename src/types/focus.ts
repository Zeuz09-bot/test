export type SessionType = 'pomodoro' | 'freeform';

export interface FocusSession {
  id: string;
  task_id: string;
  user_id: string;
  started_at: string;
  ended_at?: string | null;
  planned_minutes: number;
  actual_minutes?: number | null;
  session_type: SessionType;
  completed: number;
  created_at: string;
  synced_at?: string | null;
}

export type CreateFocusSessionInput = Omit<FocusSession, 'id' | 'created_at' | 'synced_at'>;