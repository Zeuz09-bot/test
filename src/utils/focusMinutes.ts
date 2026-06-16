import type { FocusSession } from '../types/focus';

export function calculateActualMinutes(session: FocusSession): number {
  if (session.ended_at) {
    const start = new Date(session.started_at).getTime();
    const end = new Date(session.ended_at).getTime();
    return Math.floor((end - start) / 60000);
  }
  const now = Date.now();
  const start = new Date(session.started_at).getTime();
  return Math.floor((now - start) / 60000);
}