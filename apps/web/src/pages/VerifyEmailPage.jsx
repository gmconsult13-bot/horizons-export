import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, MailCheck, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { confirmEmailVerification } = useGuestAuth();

  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      if (!token) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage('The verification link is invalid because the token is missing.');
        }
        return;
      }

      try {
        await confirmEmailVerification(token);
        if (isMounted) {
          setStatus('success');
        }
      } catch (error) {
        console.error('Email verification failed:', error);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(
            error?.response?.message ||
              error?.message ||
              'The verification link is invalid or has expired.',
          );
        }
      }
    };

    verifyEmail();
    return () => {
      isMounted = false;
    };
  }, [token, confirmEmailVerification]);

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
                <h1 className="text-2xl font-bold font-serif mb-2">Verifying Email</h1>
                <p className="text-muted-foreground text-sm">
                  Please wait while we verify your email address.
                </p>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-6">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto">
                <MailCheck className="w-8 h-8 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif mb-2">Email Verified</h1>
                <p className="text-muted-foreground text-sm">
                  Your account is now active. You can log in and manage your bookings.
                </p>
              </div>
              <Button asChild className="w-full h-12">
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
                <h1 className="text-2xl font-bold font-serif mb-2">Verification Failed</h1>
                <p className="text-muted-foreground text-sm px-4">{errorMessage}</p>
              </div>
              <div className="pt-4 space-y-3">
                <Button asChild className="w-full h-12">
                  <Link to="/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline" className="w-full h-12">
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
