import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/ui/Toast';
import { AppHeader } from './components/layout/AppHeader';
import { ProtectedRoute } from './components/ProtectedRoute';

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

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
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

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
