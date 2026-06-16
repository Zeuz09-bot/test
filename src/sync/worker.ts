import NetInfo from '@react-native-community/netinfo';
import db from '../db/client';
import { supabase } from '../api/client';
import type { SyncQueueRow } from './queue';

const MAX_ATTEMPTS = 5;
const POLL_INTERVAL_MS = 30_000;
const BATCH_SIZE = 25;

export async function startSyncWorker() {
  setInterval(async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) return;
    await flushQueue();
  }, POLL_INTERVAL_MS);
}

async function flushQueue() {
  const pending = await db.getAllAsync<SyncQueueRow>(
    `SELECT * FROM sync_queue WHERE attempts < ? ORDER BY created_at ASC LIMIT ?`,
    [MAX_ATTEMPTS, BATCH_SIZE]
  );

  for (const row of pending) {
    try {
      const payload = JSON.parse(row.payload);
      if (row.operation === 'DELETE') {
        await (supabase.from(row.table_name as any) as any).delete().eq('id', row.record_id);
      } else {
        await (supabase.from(row.table_name as any) as any).upsert(payload);
      }
      await db.runAsync(`DELETE FROM sync_queue WHERE id = ?`, [row.id]);
      await db.runAsync(
        `UPDATE ${row.table_name} SET synced_at = ? WHERE id = ?`,
        [new Date().toISOString(), row.record_id]
      );
    } catch (err) {
      await db.runAsync(
        `UPDATE sync_queue SET attempts = attempts + 1, last_attempt_at = ? WHERE id = ?`,
        [new Date().toISOString(), row.id]
      );
    }
  }
}