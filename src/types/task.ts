export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'dropped';

export interface Task {
  id: string;
  user_id: string;
  goal_id?: string | null;
  title: string;
  description?: string | null;
  priority: Priority;
  status: TaskStatus;
  deadline?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  estimated_minutes?: number | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  synced_at?: string | null;
}

export type CreateTaskInput = Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>;