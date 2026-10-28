import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, Profile } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_approved: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  loginAsStub: (role: UserRole, isApproved?: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Initial mock stub user for quick prototyping and testing
const DEFAULT_STUB_USER: AuthUser = {
  id: 'stub-student-id',
  email: 'student@recallloop.dev',
  full_name: 'Alex Student',
  role: 'student',
  is_approved: true,
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('recallloop_v2_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return DEFAULT_STUB_USER;
      }
    }
    return DEFAULT_STUB_USER;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Supabase Auth listener
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const profile = data as unknown as Profile | null;
          if (profile) {
            const authUser: AuthUser = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              is_approved: profile.status === 'active',
            };
            setUser(authUser);
            localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(authUser));
          }
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      const profile = data as unknown as Profile | null;
      if (profile) {
        const authUser: AuthUser = {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          is_approved: profile.status === 'active',
        };
        setUser(authUser);
        localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(authUser));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginAsStub = (role: UserRole, isApproved: boolean = true) => {
    const names: Record<UserRole, string> = {
      student: 'Alex Student',
      teacher: isApproved ? 'Prof. Sarah Lin' : 'Jane Doe (Pending)',
      admin: 'Root Administrator',
    };
    const stubUser: AuthUser = {
      id: `stub-${role}-id`,
      email: `${role}@recallloop.dev`,
      full_name: names[role],
      role,
      is_approved: role === 'teacher' ? isApproved : true,
    };
    setUser(stubUser);
    localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(stubUser));
  };

  const signOut = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('recallloop_v2_auth_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isLoading,
        loginAsStub,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
