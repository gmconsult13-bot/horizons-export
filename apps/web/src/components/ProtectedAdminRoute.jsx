import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

export default function ProtectedAdminRoute({ children }) {
  const { isAuthenticated, isInitialized, currentUser } = useAdminAuth();
  const location = useLocation();

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin mb-4" />
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        state={{ from: location }}
        replace
      />
    );
  }

  const isAdmin =
    currentUser?.is_admin === true ||
    currentUser?.role === 'admin';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
