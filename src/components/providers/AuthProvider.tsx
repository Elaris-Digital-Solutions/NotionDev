import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

type AuthState = 'IDLE' | 'LOADING' | 'AUTHENTICATED' | 'UNAUTHENTICATED' | 'ERROR';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  state: AuthState;
  error: AuthError | null;
  signOut: () => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  reauthenticate: (password: string) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  state: 'IDLE',
  error: null,
  signOut: async () => { },
  updatePassword: async () => { },
  reauthenticate: async () => { },
  refreshSession: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [state, setState] = useState<AuthState>('IDLE');
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize session
  const initializeAuth = useCallback(async () => {
    try {
      setState('LOADING');
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        throw error;
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        setState('AUTHENTICATED');
      } else {
        setSession(null);
        setUser(null);
        setState('UNAUTHENTICATED');
      }
    } catch (err: any) {
      console.error('Auth initialization error:', err);
      setError(err);
      // In case of error, we default to unauthenticated to prevent white screens,
      // but keep the error state available for UI feedback
      setSession(null);
      setUser(null);
      setState('ERROR');
    }
  }, []);

  useEffect(() => {
    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {


      if (event === 'SIGNED_OUT') {
        setSession(null);
        setUser(null);
        setState('UNAUTHENTICATED');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(session);
        setUser(session?.user ?? null);
        setState('AUTHENTICATED');
      } else if (event === 'USER_UPDATED') {
        setSession(session);
        setUser(session?.user ?? null);
      }
    });

    return () => subscription.unsubscribe();
  }, [initializeAuth]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setState('UNAUTHENTICATED');
      setSession(null);
      setUser(null);
    } catch (err: any) {
      console.error('Error signing out:', err);
      toast.error('Failed to sign out fully, but local session cleared.');
    }
  };

  const reauthenticate = async (password: string) => {
    if (!user?.email) throw new Error("No user email found");

    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: password,
    });

    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;
    toast.success('Password updated successfully');
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setState('AUTHENTICATED');
      }
    } catch (err: any) {
      console.error('Session refresh failed:', err);
      // Don't force logout on refresh fail immediately unless critical
      // But user might need to re-login eventually
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      state,
      error, // Expose loading via state derived value for backward compatibility if needed, using explicit state now
      signOut,
      updatePassword,
      reauthenticate,
      refreshSession
    }}>
      {children}
    </AuthContext.Provider>
  );
}
