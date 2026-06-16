import { useFocusStore } from '../stores/focusStore';
import { useAuthStore } from '../stores/authStore';
import type { Task } from '../types/task';

export async function startFocusSession(taskId: string) {
  const { user } = useAuthStore.getState();
  const { startSession } = useFocusStore.getState();
  await startSession({
    task_id: taskId,
    user_id: user?.id ?? '',
    session_type: 'pomodoro',
    planned_minutes: 25,
    started_at: new Date().toISOString(),
    completed: 0,
  });
}