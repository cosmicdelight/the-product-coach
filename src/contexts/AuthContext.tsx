import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  activeRole: UserRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, roles: UserRole[]) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  switchRole: (role: UserRole) => void;
  addRole: (role: UserRole) => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Pick<Profile, 'full_name' | 'organization' | 'job_title'>>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
          setActiveRole(null);
          setLoading(false);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      setProfile(data);
      if (data) {
        const roles: UserRole[] = data.roles?.length ? data.roles : [data.role];
        setActiveRole(prev => {
          if (prev && roles.includes(prev)) return prev;
          return roles[0] ?? null;
        });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, fullName: string, roles: UserRole[]) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          return { error: new Error('An account with this email already exists. Please sign in instead.') };
        }
        throw error;
      }
      if (!data.user) {
        return { error: new Error('An account with this email already exists. Please sign in instead.') };
      }
      const existingProfile = await supabase.from('profiles').select('id').eq('id', data.user.id).maybeSingle();
      if (existingProfile.data) {
        await supabase.auth.signOut();
        return { error: new Error('An account with this email already exists. Please sign in instead.') };
      }
      const primaryRole = roles[0] ?? 'officer';
      const { error: profileError } = await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
        role: primaryRole,
        roles,
      });
      if (profileError) {
        await supabase.auth.signOut();
        if (profileError.code === '23505') {
          return { error: new Error('An account with this email already exists. Please sign in instead.') };
        }
        throw profileError;
      }
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error: error ? new Error(error.message) : null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const switchRole = (role: UserRole) => {
    const roles: UserRole[] = profile?.roles?.length ? profile.roles : profile?.role ? [profile.role] : [];
    if (roles.includes(role)) {
      setActiveRole(role);
    }
  };

  const addRole = async (role: UserRole) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const currentRoles: UserRole[] = profile?.roles?.length ? profile.roles : profile?.role ? [profile.role] : [];
      if (currentRoles.includes(role)) return { error: null };
      const newRoles = [...currentRoles, role];
      const { error } = await supabase
        .from('profiles')
        .update({ roles: newRoles, role: newRoles[0] })
        .eq('id', user.id);
      if (error) throw error;
      await loadProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const updateProfile = async (updates: Partial<Pick<Profile, 'full_name' | 'organization' | 'job_title'>>) => {
    if (!user) return { error: new Error('Not authenticated') };
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);
      if (error) throw error;
      await loadProfile(user.id);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, activeRole, loading, signIn, signUp, signOut, resetPassword, switchRole, addRole, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
