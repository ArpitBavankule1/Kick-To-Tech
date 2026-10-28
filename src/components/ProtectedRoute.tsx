import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/database';
import { Skeleton } from './ui/Skeleton';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-md space-y-4">
          <Skeleton height={32} />
          <Skeleton height={120} />
          <Skeleton height={40} />
        </div>
      </div>
    );
  }

  // 1. Session check: Not logged in
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. Teacher approval check: Rule: Teachers need admin approval
  if (user.role === 'teacher' && !user.is_approved) {
    return <Navigate to="/pending" replace />;
  }

  // 3. Role check: If specific roles are required
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Route to user's authorized home or root
    const fallbackPath =
      user.role === 'student'
        ? '/student'
        : user.role === 'teacher'
        ? '/teacher'
        : '/admin';
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
