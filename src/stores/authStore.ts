import { create } from 'zustand';
import { supabase } from '../api/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  restoreSession: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  loading: true,
  restoreSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Failed to restore session:', error);
      set({ session: null, user: null, loading: false });
      return;
    }
    const session = data.session;
    set({
      session,
      user: session?.user ?? null,
      loading: false,
    });
  },
  signInWithEmail: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
    await useAuthStore.getState().restoreSession();
  },
  signInWithGoogle: async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) {
      throw error;
    }
    await useAuthStore.getState().restoreSession();
  },
  signUp: async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      throw error;
    }
    await useAuthStore.getState().restoreSession();
  },
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    set({ session: null, user: null, loading: false });
  },
}));