export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';

export interface Habit {
  id: string;
  user_id: string;
  goal_id?: string | null;
  title: string;
  frequency: HabitFrequency;
  custom_days?: string | null;
  reminder_time?: string | null;
  current_streak: number;
  longest_streak: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  synced_at?: string | null;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  completed: number;
  completed_at?: string | null;
  created_at: string;
  synced_at?: string | null;
}

export type CreateHabitInput = Omit<Habit, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'synced_at'>;