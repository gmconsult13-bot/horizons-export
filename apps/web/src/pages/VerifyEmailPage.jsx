import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, MailCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link');
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await apiServerClient.fetch('/email-verification/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token })
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || data.error || 'Verification failed. The link may be invalid or expired.');
        }

        setStatus('success');
      } catch (error) {
        console.error('Email verification error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An unexpected error occurred during verification.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Verify Email | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-sm border border-border text-center">
          {status === 'loading' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif mb-2 text-foreground">Verifying Email</h1>
                <p className="text-muted-foreground text-sm">Please wait while we verify your email address...</p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <MailCheck className="w-8 h-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif mb-2 text-foreground">Email verified successfully!</h1>
                <p className="text-muted-foreground text-sm">
                  Your account is now fully active. You can log in to manage your bookings and profile.
                </p>
              </div>
              <Button asChild className="w-full mt-4 h-12 text-base transition-all duration-200 active:scale-[0.98]">
                <Link to="/login">Continue to Login</Link>
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif mb-2 text-foreground">Verification Failed</h1>
                <p className="text-muted-foreground text-sm px-4">
                  {errorMessage}
                </p>
              </div>
              <div className="pt-4 space-y-3">
                <Button asChild className="w-full h-12 text-base transition-all duration-200 active:scale-[0.98]">
                  <Link to="/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-12 text-base">
                  <Link to="/register">Register Again</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}