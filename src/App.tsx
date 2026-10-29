import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { AppHeader } from './components/layout/AppHeader';
import { DevRoleSwitcher } from './components/layout/DevRoleSwitcher';
import { ProtectedRoute } from './components/ProtectedRoute';

import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { OfflineBanner } from './components/ui/OfflineBanner';
import { useAuth } from './hooks/useAuth';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { PendingPage } from './pages/public/PendingPage';
import { NotFoundPage } from './pages/public/NotFoundPage';

// Student Pages
import { StudentDashboard } from './pages/student/StudentDashboard';
import { SubjectDetailPage } from './pages/student/SubjectDetailPage';
import { QuizSessionPage } from './pages/student/QuizSessionPage';

// Teacher Pages
import { TeacherDashboard } from './pages/teacher/TeacherDashboard';
import { AssignTopicPage } from './pages/teacher/AssignTopicPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminSubjectsPage } from './pages/admin/AdminSubjectsPage';
import { AdminMappingPage } from './pages/admin/AdminMappingPage';

const SessionExpiryListener: React.FC = () => {
  const { isSessionExpired, clearSessionExpired } = useAuth();
  if (!isSessionExpired) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="session-expired-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
    >
      <div className="max-w-md w-full p-6 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-center space-y-4">
        <h3 id="session-expired-title" className="text-lg font-bold text-white">
          Session Expired
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Your authenticated session has expired for security. Please sign in again to continue your adaptive practice.
        </p>
        <div className="pt-2">
          <a
            href="/login"
            onClick={() => clearSessionExpired()}
            className="w-full inline-flex justify-center items-center px-4 py-2.5 rounded-xl bg-cyan-400 text-slate-900 font-semibold hover:bg-cyan-300 text-sm transition-colors cursor-pointer"
          >
            Sign In Again
          </a>
        </div>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
              <OfflineBanner />
              <SessionExpiryListener />
              <AppHeader />
              <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/pending" element={<PendingPage />} />

                {/* Student Routes */}
                <Route
                  path="/student"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin']}>
                      <StudentDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/subject/:id"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin']}>
                      <SubjectDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/student/quiz/:assignmentId"
                  element={
                    <ProtectedRoute allowedRoles={['student', 'admin']}>
                      <QuizSessionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Teacher Routes (Gated by admin approval) */}
                <Route
                  path="/teacher"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                      <TeacherDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/teacher/assign"
                  element={
                    <ProtectedRoute allowedRoles={['teacher', 'admin']}>
                      <AssignTopicPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes (Seeded only) */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/subjects"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSubjectsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/mapping"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminMappingPage />
                    </ProtectedRoute>
                  }
                />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
            <DevRoleSwitcher />
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
};

export default App;
