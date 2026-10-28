import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { UserRole, UserStatus, Profile } from '../types/database';
import { subjectsService } from './subjects.service';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  status: UserStatus;
  is_approved: boolean; // status === 'active'
}

export interface StudentRegistrationParams {
  name: string;
  email: string;
  password: string;
  subjectCode: string;
}

export interface TeacherRegistrationParams {
  name: string;
  email: string;
  password: string;
  subjectId: string;
}

export const authService = {
  /**
   * Signs in an existing user and fetches their profile to verify status and role.
   */
  async signIn(email: string, password: string): Promise<AuthUser> {
    const trimmedEmail = email.trim();

    if (!isSupabaseConfigured) {
      // Mock login for demo/testing
      const role: UserRole = trimmedEmail.includes('admin')
        ? 'admin'
        : trimmedEmail.includes('teacher')
        ? 'teacher'
        : 'student';
      const isPending = trimmedEmail.includes('pending');
      const status: UserStatus = isPending ? 'pending' : 'active';

      return {
        id: `mock-${role}-id`,
        email: trimmedEmail,
        full_name: role === 'admin' ? 'Root Admin' : role === 'teacher' ? 'Prof. Test' : 'Alex Student',
        role,
        status,
        is_approved: status === 'active',
      };
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Authentication failed. Please verify credentials.');
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle();

    const profile = profileData as unknown as Profile | null;

    if (profileError || !profile) {
      // Fallback: derive role from user metadata if profile row isn't synced yet
      const metaRole = (authData.user.user_metadata?.role as UserRole) || 'student';
      const metaName = (authData.user.user_metadata?.full_name as string) || trimmedEmail.split('@')[0];
      return {
        id: authData.user.id,
        email: authData.user.email || trimmedEmail,
        full_name: metaName,
        role: metaRole,
        status: metaRole === 'teacher' ? 'pending' : 'active',
        is_approved: metaRole !== 'teacher',
      };
    }

    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      status: profile.status,
      is_approved: profile.status === 'active',
    };
  },

  /**
   * Registers a student.
   * Invariants:
   * 1. Validates subject code against `subjects` table.
   * 2. Creates user in auth.
   * 3. Sets profile role = 'student', status = 'active'.
   * 4. Enrolls student into the verified subject.
   */
  async registerStudent(params: StudentRegistrationParams): Promise<{ user: AuthUser; subjectName: string }> {
    const { valid, subject, error: codeError } = await subjectsService.validateSubjectCode(params.subjectCode);
    if (!valid || !subject) {
      throw new Error(codeError || `Subject code "${params.subjectCode}" is invalid.`);
    }

    const trimmedEmail = params.email.trim();
    const fullName = params.name.trim();

    if (!isSupabaseConfigured) {
      const mockUser: AuthUser = {
        id: `mock-student-${Date.now()}`,
        email: trimmedEmail,
        full_name: fullName,
        role: 'student',
        status: 'active',
        is_approved: true,
      };
      return { user: mockUser, subjectName: subject.name };
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: params.password,
      options: {
        data: {
          full_name: fullName,
          role: 'student',
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create student account.');
    }

    const userId = authData.user.id;

    // 2. Create or ensure profile row
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: trimmedEmail,
      full_name: fullName,
      role: 'student',
      status: 'active',
    });

    if (profileError) {
      console.warn('Profile upsert note:', profileError.message);
    }

    // 3. Create enrollment
    const { error: enrollError } = await supabase.from('enrollments').insert({
      student_id: userId,
      subject_id: subject.id,
    });

    if (enrollError) {
      console.warn('Enrollment insert note:', enrollError.message);
    }

    const authUser: AuthUser = {
      id: userId,
      email: trimmedEmail,
      full_name: fullName,
      role: 'student',
      status: 'active',
      is_approved: true,
    };

    return { user: authUser, subjectName: subject.name };
  },

  /**
   * Registers a teacher.
   * Invariants:
   * 1. Creates user in auth.
   * 2. Sets profile role = 'teacher', status = 'pending' (Requires Admin Approval).
   * 3. Maps teacher to selected subject in `teacher_subjects`.
   */
  async registerTeacher(params: TeacherRegistrationParams): Promise<{ user: AuthUser }> {
    const trimmedEmail = params.email.trim();
    const fullName = params.name.trim();

    if (!isSupabaseConfigured) {
      const mockUser: AuthUser = {
        id: `mock-teacher-${Date.now()}`,
        email: trimmedEmail,
        full_name: fullName,
        role: 'teacher',
        status: 'pending',
        is_approved: false,
      };
      return { user: mockUser };
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: params.password,
      options: {
        data: {
          full_name: fullName,
          role: 'teacher',
        },
      },
    });

    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create educator account.');
    }

    const userId = authData.user.id;

    // 2. Insert profile with pending status
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: trimmedEmail,
      full_name: fullName,
      role: 'teacher',
      status: 'pending',
    });

    if (profileError) {
      console.warn('Teacher profile upsert note:', profileError.message);
    }

    // 3. Map to chosen subject
    if (params.subjectId) {
      const { error: subjectMapError } = await supabase.from('teacher_subjects').insert({
        teacher_id: userId,
        subject_id: params.subjectId,
      });

      if (subjectMapError) {
        console.warn('Teacher subject mapping note:', subjectMapError.message);
      }
    }

    const authUser: AuthUser = {
      id: userId,
      email: trimmedEmail,
      full_name: fullName,
      role: 'teacher',
      status: 'pending',
      is_approved: false,
    };

    return { user: authUser };
  },

  /**
   * Signs the user out.
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  },
};
