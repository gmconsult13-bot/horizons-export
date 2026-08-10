import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Verifying credentials...</p>
      </div>
    );
  }

  // Check if they are logged in but as a regular user
  if (!isAdminAuthenticated && pb.authStore.isValid) {
    const isRegularUser = pb.authStore.model && !pb.authStore.model.is_admin && pb.authStore.model.role !== 'admin';
    if (isRegularUser) {
      // Redirect regular users attempting to access admin routes back to the public homepage
      return <Navigate to="/" replace />;
    }
  }

  // If not authenticated as admin, redirect to admin login
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}