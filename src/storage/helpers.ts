import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'flowday-storage' });

export const storageKeys = {
  LAST_SYNC: 'last_sync_at',
  ONBOARDING_COMPLETE: 'onboarding_complete',
  LAST_REVIEW_DATE: 'last_review_date',
  NOTIFICATIONS_ENABLED: 'notifications_enabled',
  MORNING_CUE_TIME: 'morning_cue_time',
  EVENING_PROMPT_TIME: 'evening_prompt_time',
} as const;

export function getLastSync(): string | null {
  return storage.getString(storageKeys.LAST_SYNC) ?? null;
}

export function setLastSync(date: string) {
  storage.set(storageKeys.LAST_SYNC, date);
}

export function isOnboardingComplete(): boolean {
  return storage.getBoolean(storageKeys.ONBOARDING_COMPLETE) ?? false;
}

export function setOnboardingComplete(val: boolean) {
  storage.set(storageKeys.ONBOARDING_COMPLETE, val);
}

export function getString(key: string): string | null {
  return storage.getString(key) ?? null;
}

export function setString(key: string, val: string) {
  storage.set(key, val);
}

export default storage;
