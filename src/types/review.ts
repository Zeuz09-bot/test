export interface DayReview {
  id: string;
  user_id: string;
  review_date: string;
  tasks_total: number;
  tasks_completed: number;
  habits_total: number;
  habits_completed: number;
  focus_minutes: number;
  focus_sessions: number;
  score: number;
  notes?: string | null;
  created_at: string;
  synced_at?: string | null;
}

export type CreateReviewInput = Omit<DayReview, 'id' | 'created_at' | 'synced_at'>;
