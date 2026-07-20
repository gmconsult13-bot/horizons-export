import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import { Loader2 } from 'lucide-react';

export default function ProtectedGuestRoute({ children }) {
  const { isGuestAuthenticated, isLoading } = useGuestAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground text-sm">Verifying authentication...</p>
      </div>
    );
  }

  if (!isGuestAuthenticated) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}