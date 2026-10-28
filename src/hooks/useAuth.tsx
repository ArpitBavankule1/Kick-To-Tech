import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserRole, UserStatus, Profile } from '../types/database';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  authService,
  type AuthUser,
  type StudentRegistrationParams,
  type TeacherRegistrationParams,
} from '../services/auth.service';

export type { AuthUser };

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  registerStudent: (params: StudentRegistrationParams) => Promise<{ user: AuthUser; subjectName: string }>;
  registerTeacher: (params: TeacherRegistrationParams) => Promise<{ user: AuthUser }>;
  loginAsStub: (role: UserRole, isApproved?: boolean, status?: UserStatus) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('recallloop_v2_auth_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Supabase Auth session initial check
    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          const profile = data as unknown as Profile | null;
          if (profile) {
            const authUser: AuthUser = {
              id: profile.id,
              email: profile.email,
              full_name: profile.full_name,
              role: profile.role,
              status: profile.status,
              is_approved: profile.status === 'active',
            };
            setUser(authUser);
            localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(authUser));
          }
        }
      } catch (err) {
        console.error('Error initializing auth session:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        return;
      }
      try {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        const profile = data as unknown as Profile | null;
        if (profile) {
          const authUser: AuthUser = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            role: profile.role,
            status: profile.status,
            is_approved: profile.status === 'active',
          };
          setUser(authUser);
          localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(authUser));
        }
      } catch (err) {
        console.error('Error refreshing profile on auth state change:', err);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const authUser = await authService.signIn(email, password);
      setUser(authUser);
      localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(authUser));
      return authUser;
    } finally {
      setIsLoading(false);
    }
  };

  const registerStudent = async (params: StudentRegistrationParams) => {
    setIsLoading(true);
    try {
      const result = await authService.registerStudent(params);
      setUser(result.user);
      localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(result.user));
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const registerTeacher = async (params: TeacherRegistrationParams) => {
    setIsLoading(true);
    try {
      const result = await authService.registerTeacher(params);
      setUser(result.user);
      localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(result.user));
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsStub = (
    role: UserRole,
    isApproved: boolean = true,
    customStatus?: UserStatus
  ) => {
    const names: Record<UserRole, string> = {
      student: 'Alex Student',
      teacher: isApproved ? 'Prof. Sarah Lin' : 'Jane Doe (Pending)',
      admin: 'Root Administrator',
    };

    const status: UserStatus = customStatus
      ? customStatus
      : role === 'teacher' && !isApproved
      ? 'pending'
      : 'active';

    const stubUser: AuthUser = {
      id: `stub-${role}-id`,
      email: `${role}@recallloop.dev`,
      full_name: names[role],
      role,
      status,
      is_approved: status === 'active',
    };

    setUser(stubUser);
    localStorage.setItem('recallloop_v2_auth_user', JSON.stringify(stubUser));
  };

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
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
        signIn,
        registerStudent,
        registerTeacher,
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
