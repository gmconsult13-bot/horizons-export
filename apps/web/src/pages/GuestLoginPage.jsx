import React, {
  useEffect,
  useState,
} from 'react';
import {
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Loader2,
  LogIn,
  MailCheck,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function GuestLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    resendVerification,
  } = useGuestAuth();

  const from =
    location.state?.from?.pathname ||
    '/guest/dashboard';

  const registeredEmail =
    location.state?.registeredEmail || '';

  const verificationRequired =
    location.state?.verificationRequired ===
    true;

  const [formData, setFormData] =
    useState({
      email: registeredEmail,
      password: '',
    });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [
    isResendingVerification,
    setIsResendingVerification,
  ] = useState(false);

  const [
    needsVerification,
    setNeedsVerification,
  ] = useState(verificationRequired);

  useEffect(() => {
    if (verificationRequired) {
      setNeedsVerification(true);
    }
  }, [verificationRequired]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (
      !formData.email.trim() ||
      !formData.password
    ) {
      toast.error(
        'Please enter your email and password.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await login(
        formData.email,
        formData.password,
      );

      toast.success('Welcome back!');

      navigate(from, {
        replace: true,
      });
    } catch (error) {
      console.error(
        'Guest login failed:',
        error,
      );

      if (
        error?.code ===
        'EMAIL_NOT_VERIFIED'
      ) {
        setNeedsVerification(true);

        toast.error(
          'Email verification required',
          {
            description:
              error.message,
          },
        );
      } else {
        toast.error(
          'Invalid email or password.',
          {
            description:
              'Please check your credentials and try again.',
          },
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification =
    async () => {
      const email =
        formData.email.trim();

      if (!email) {
        toast.error(
          'Enter your email address first.',
        );
        return;
      }

      setIsResendingVerification(true);

      try {
        await resendVerification(email);

        toast.success(
          'Verification email sent',
          {
            description:
              'Please check your inbox and spam folder.',
          },
        );
      } catch (error) {
        console.error(
          'Resend verification failed:',
          error,
        );

        toast.error(
          'Unable to send verification email.',
          {
            description:
              error?.response?.message ||
              error?.message ||
              'Please try again later.',
          },
        );
      } finally {
        setIsResendingVerification(false);
      }
    };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Login | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2">
              Welcome Back
            </h1>

            <p className="text-muted-foreground text-sm">
              Sign in to manage your
              bookings and guest profile.
            </p>
          </div>

          {needsVerification && (
            <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4">
              <div className="flex gap-3">
                <MailCheck className="w-5 h-5 text-primary mt-0.5 shrink-0" />

                <div className="space-y-2">
                  <p className="font-medium text-sm">
                    Verify your email
                    before logging in.
                  </p>

                  <p className="text-xs text-muted-foreground">
                    Check your inbox and
                    spam folder for the
                    verification message.
                  </p>

                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    disabled={
                      isResendingVerification
                    }
                    onClick={
                      handleResendVerification
                    }
                  >
                    {isResendingVerification
                      ? 'Sending...'
                      : 'Resend verification email'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address
              </Label>

              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <LogIn className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <Link
              to="/forgot-password"
              className="text-primary hover:underline font-medium"
            >
              Forgot your password?
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="text-primary font-medium hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}