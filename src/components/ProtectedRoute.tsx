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

  // 1. Accessible Loading State
  if (isLoading) {
    return (
      <div
        className="min-h-[60vh] flex items-center justify-center p-6"
        role="status"
        aria-live="polite"
        aria-label="Verifying authorization and credentials"
      >
        <div className="w-full max-w-md space-y-4">
          <Skeleton height={28} className="w-1/2 mx-auto" />
          <Skeleton height={140} className="w-full rounded-2xl" />
          <Skeleton height={44} className="w-full rounded-xl" />
        </div>
      </div>
    );
  }

  // 2. Session Check: No active session -> redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Status Check: Pending or Suspended accounts -> redirect to /pending
  const isPendingOrSuspended =
    user.status === 'pending' ||
    user.status === 'suspended' ||
    (user.role === 'teacher' && !user.is_approved);

  if (isPendingOrSuspended) {
    return <Navigate to="/pending" replace />;
  }

  // 4. Role Authorization Check: Wrong role -> redirect to appropriate home
  if (allowedRoles && !allowedRoles.includes(user.role)) {
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
