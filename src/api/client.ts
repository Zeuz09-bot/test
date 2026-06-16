import { createClient } from '@supabase/supabase-js';
import { createMMKV } from 'react-native-mmkv';
import type { Database } from '../types/supabase';

const storage = createMMKV({ id: 'supabase-auth' });

export const supabase = createClient<Database>(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: {
        getItem: (key) => storage.getString(key) ?? null,
        setItem: (key, val) => storage.set(key, val),
        removeItem: (key) => { storage.remove(key); },
      },
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);