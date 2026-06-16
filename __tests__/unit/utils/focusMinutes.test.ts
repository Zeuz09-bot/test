import { calculateActualMinutes } from '../../../src/utils/focusMinutes';
import type { FocusSession } from '../../../src/types/focus';

describe('Focus Minutes', () => {
  it('should calculate actual minutes from ended session', () => {
    const session: FocusSession = {
      id: 's1',
      task_id: 't1',
      user_id: 'u1',
      started_at: '2026-06-16T10:00:00Z',
      ended_at: '2026-06-16T11:30:00Z',
      planned_minutes: 60,
      actual_minutes: 90,
      session_type: 'pomodoro',
      completed: 1,
      created_at: '2026-06-16T10:00:00Z',
    };
    expect(calculateActualMinutes(session)).toBe(90);
  });

  it('should return 0 for session with same start and end', () => {
    const session: FocusSession = {
      id: 's2',
      task_id: 't1',
      user_id: 'u1',
      started_at: '2026-06-16T10:00:00Z',
      ended_at: '2026-06-16T10:00:00Z',
      planned_minutes: 25,
      actual_minutes: 0,
      session_type: 'pomodoro',
      completed: 1,
      created_at: '2026-06-16T10:00:00Z',
    };
    expect(calculateActualMinutes(session)).toBe(0);
  });
});
