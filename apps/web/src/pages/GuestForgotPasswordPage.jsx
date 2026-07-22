import React, {
  useState,
} from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
  useForm,
} from 'react-hook-form';
import {
  zodResolver,
} from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email(
      'Please enter a valid email address',
    ),
});

export default function GuestForgotPasswordPage() {
  const {
    requestPasswordReset,
  } = useGuestAuth();

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [isSuccess, setIsSuccess] =
    useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(
      forgotPasswordSchema,
    ),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      await requestPasswordReset(
        data.email,
      );

      setIsSuccess(true);

      toast.success(
        'Password reset instructions requested.',
      );
    } catch (error) {
      console.error(
        'Password-reset request failed:',
        error,
      );

      /*
       * Keep the response neutral so the
       * page does not reveal whether an
       * account exists for this email.
       */
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Forgot Password | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2">
              Reset Password
            </h1>

            <p className="text-muted-foreground text-sm">
              Enter your email to receive
              password-reset instructions.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-semibold">
                  Check Your Inbox
                </h3>

                <p className="text-muted-foreground text-sm">
                  If an account exists for
                  this email, reset
                  instructions have been
                  sent. Please also check
                  your spam folder.
                </p>
              </div>

              <Button
                asChild
                variant="outline"
                className="w-full h-11"
              >
                <Link to="/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Login
                </Link>
              </Button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit(
                onSubmit,
              )}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="name@example.com"
                    className={`pl-10 ${
                      errors.email
                        ? 'border-destructive'
                        : ''
                    }`}
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>

                {errors.email && (
                  <p className="text-sm text-destructive font-medium">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>

                <Button
                  asChild
                  variant="ghost"
                  className="w-full h-11"
                >
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}