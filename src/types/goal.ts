export type GoalCategory = 'health' | 'career' | 'learning' | 'finance' | 'relationships' | 'personal';
export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: GoalCategory;
  target_date?: string | null;
  progress_pct: number;
  status: GoalStatus;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  synced_at?: string | null;
}

export type CreateGoalInput = Omit<Goal, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>;