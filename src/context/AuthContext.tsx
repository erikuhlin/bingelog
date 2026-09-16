'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { syncLocalDataToSupabase } from '@/lib/storage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error?: string }>;
  signUp: (
    email: string,
    pass: string,
    username?: string
  ) => Promise<{ error?: string; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      if (session?.user) {
        syncLocalDataToSupabase(session.user.id);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setLoading(false);

      if (newSession?.user) {
        await syncLocalDataToSupabase(newSession.user.id);
        window.dispatchEvent(new Event('bingelog_storage_changed'));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const signIn = async (email: string, pass: string) => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase är inte konfigurerat.' };

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });

    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return {
          error:
            'Din e-postadress har inte bekräftats än. Vänligen klicka på länken i bekräftelsemejlet från Bingelog.',
        };
      }
      return { error: error.message };
    }

    closeAuthModal();
    return {};
  };

  const signUp = async (
    email: string,
    pass: string,
    username?: string
  ): Promise<{ error?: string; needsEmailVerification?: boolean }> => {
    const supabase = getSupabaseClient();
    if (!supabase) return { error: 'Supabase är inte konfigurerat.' };

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const emailRedirectTo = origin ? `${origin}/auth/callback` : undefined;

    const { error, data } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo,
        data: {
          username: username || email.split('@')[0],
          full_name: username || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    // If session was directly established (email confirmation disabled in Supabase)
    if (data?.session) {
      closeAuthModal();
      return { needsEmailVerification: false };
    }

    // Check if user already exists (Supabase returns empty identities array when user already exists)
    if (data?.user && data.user.identities && data.user.identities.length === 0) {
      return {
        error: 'Ett konto med denna e-postadress finns redan. Vänligen logga in istället.',
      };
    }

    // User was created and email verification is needed
    if (data?.user) {
      return { needsEmailVerification: true };
    }

    return {};
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
      window.dispatchEvent(new Event('bingelog_storage_changed'));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
