import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: useEffect started');

    const initAuth = async () => {
      try {
        console.log('AuthProvider: Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthProvider: Session received, user:', !!session?.user);

        if (session?.user) {
          ensureUserProfile(session.user.id, session.user.email);
        }

        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        console.log('AuthProvider: setLoading(false)');
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        ensureUserProfile(session.user.id, session.user.email);
      }
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const ensureUserProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!existingProfile) {
        await supabase.from('user_profiles').insert([{
          id: userId,
          display_name: email?.split('@')[0] || 'User',
          total_xp: 0,
          level: 1,
          current_streak: 0,
          longest_streak: 0,
        }]);
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
