import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import * as useAuthModule from '../hooks/useAuth';
import type { AuthUser } from '../services/auth.service';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithRouter = (
    ui: React.ReactNode,
    initialEntry: string = '/protected'
  ) => {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/protected" element={ui} />
          <Route path="/login" element={<div>Login Page Target</div>} />
          <Route path="/pending" element={<div>Pending Page Target</div>} />
          <Route path="/student" element={<div>Student Home Target</div>} />
          <Route path="/teacher" element={<div>Teacher Home Target</div>} />
          <Route path="/admin" element={<div>Admin Home Target</div>} />
        </Routes>
      </MemoryRouter>
    );
  };

  it('redirects unauthenticated users to /login', () => {
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      role: null,
      isLoading: false,
      signIn: vi.fn(),
      registerStudent: vi.fn(),
      registerTeacher: vi.fn(),
      loginAsStub: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute>
        <div>Secret Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Secret Content')).toBeNull();
    expect(screen.getByText('Login Page Target')).toBeDefined();
  });

  it('redirects pending teachers to /pending', () => {
    const pendingTeacher: AuthUser = {
      id: 'teacher-1',
      email: 'teacher@school.edu',
      full_name: 'Pending Teacher',
      role: 'teacher',
      status: 'pending',
      is_approved: false,
    };

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: pendingTeacher,
      role: 'teacher',
      isLoading: false,
      signIn: vi.fn(),
      registerStudent: vi.fn(),
      registerTeacher: vi.fn(),
      loginAsStub: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['teacher']}>
        <div>Teacher Portal Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Teacher Portal Content')).toBeNull();
    expect(screen.getByText('Pending Page Target')).toBeDefined();
  });

  it('redirects unauthorized roles to their authorized home dashboard', () => {
    const studentUser: AuthUser = {
      id: 'student-1',
      email: 'student@school.edu',
      full_name: 'Student User',
      role: 'student',
      status: 'active',
      is_approved: true,
    };

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: studentUser,
      role: 'student',
      isLoading: false,
      signIn: vi.fn(),
      registerStudent: vi.fn(),
      registerTeacher: vi.fn(),
      loginAsStub: vi.fn(),
      signOut: vi.fn(),
    });

    // Student attempting to access admin route
    renderWithRouter(
      <ProtectedRoute allowedRoles={['admin']}>
        <div>Admin Exclusive Data</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Admin Exclusive Data')).toBeNull();
    expect(screen.getByText('Student Home Target')).toBeDefined();
  });

  it('renders children for authorized and active users', () => {
    const studentUser: AuthUser = {
      id: 'student-1',
      email: 'student@school.edu',
      full_name: 'Student User',
      role: 'student',
      status: 'active',
      is_approved: true,
    };

    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: studentUser,
      role: 'student',
      isLoading: false,
      signIn: vi.fn(),
      registerStudent: vi.fn(),
      registerTeacher: vi.fn(),
      loginAsStub: vi.fn(),
      signOut: vi.fn(),
    });

    renderWithRouter(
      <ProtectedRoute allowedRoles={['student']}>
        <div>Authorized Student Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Authorized Student Content')).toBeDefined();
  });
});
