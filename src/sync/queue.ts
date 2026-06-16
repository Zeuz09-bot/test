import db from '../db/client';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncQueueRow {
  id: number;
  operation: SyncOperation;
  table_name: string;
  record_id: string;
  payload: string;
  attempts: number;
  last_attempt_at: string | null;
  created_at: string;
}

export async function enqueueSync(
  operation: SyncOperation,
  table_name: string,
  record_id: string,
  payload: Record<string, unknown>
) {
  await db.runAsync(
    `INSERT INTO sync_queue (operation, table_name, record_id, payload)
     VALUES (?, ?, ?, ?)`,
    [operation, table_name, record_id, JSON.stringify(payload)]
  );
}