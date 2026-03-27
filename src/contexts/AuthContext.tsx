import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { GUEST_MODE_STORAGE_KEY } from '../lib/guest';

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  isAuthenticated: boolean;
  passwordRecovery: boolean;
  enterGuestMode: () => void;
  exitGuestMode: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readGuestMode() {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(GUEST_MODE_STORAGE_KEY) === 'true';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(readGuestMode);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const updateGuestMode = (nextValue: boolean) => {
    setIsGuest(nextValue);

    if (typeof window === 'undefined') return;

    if (nextValue) window.localStorage.setItem(GUEST_MODE_STORAGE_KEY, 'true');
    else window.localStorage.removeItem(GUEST_MODE_STORAGE_KEY);
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) updateGuestMode(false);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) updateGuestMode(false);
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
      else if (event === 'USER_UPDATED') setPasswordRecovery(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const enterGuestMode = () => {
    setPasswordRecovery(false);
    setSession(null);
    updateGuestMode(true);
  };

  const exitGuestMode = () => {
    updateGuestMode(false);
  };

  const signOut = async () => {
    if (isGuest) {
      exitGuestMode();
      return;
    }

    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        isGuest,
        isAuthenticated: Boolean(session) || isGuest,
        passwordRecovery,
        enterGuestMode,
        exitGuestMode,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
