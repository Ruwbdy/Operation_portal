import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, hasRole } from '../../services/auth.service';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When provided, the user must also hold this role or be redirected. */
  requiredRole?: string;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    // Authenticated but lacking the required role → back to dashboard
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}