import { Redirect, Slot } from 'expo-router';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuthStore } from '../src/stores/authStore';
import { runMigrations } from '../src/db/migrations/runner';
import { startSyncWorker } from '../src/sync/worker';

export default function RootLayout() {
  const { session, loading, restoreSession } = useAuthStore();

  useEffect(() => {
    async function init() {
      await restoreSession();
      await runMigrations();
      await startSyncWorker();
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
    }
    init();
  }, [restoreSession]);

  if (loading) {
    return null;
  }
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }
  return <Slot />;
}