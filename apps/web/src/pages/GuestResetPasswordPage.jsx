import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function GuestResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useGuestAuth();
  const token = searchParams.get('token');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' },
  });

  const watchPassword = watch('password');
  const requirements = [
    { label: 'At least 8 characters', met: watchPassword?.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(watchPassword || '') },
    { label: 'One lowercase letter', met: /[a-z]/.test(watchPassword || '') },
    { label: 'One number', met: /[0-9]/.test(watchPassword || '') },
  ];

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('This password-reset link is invalid or expired.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmPasswordReset(token, data.password, data.confirmPassword);
      setIsSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Unable to reset password.', {
        description:
          error?.response?.message ||
          error?.message ||
          'The reset link may be invalid or expired. Please request a new one.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Helmet><title>Create New Password | Raya Boutique</title></Helmet>
        <Header />
        <main className="flex-grow flex items-center justify-center py-16 px-4 bg-muted/30">
          <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border/50 text-center space-y-6">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold font-serif">Link Invalid</h1>
            <p className="text-muted-foreground text-sm">The password-reset token is missing or invalid.</p>
            <Button asChild variant="outline" className="w-full h-11">
              <Link to="/forgot-password">Request New Link</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Create New Password | Raya Boutique</title></Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">Set New Password</h1>
            <p className="text-muted-foreground text-sm">Create a strong and secure password for your account.</p>
          </div>

          {isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Password Updated</h3>
                <p className="text-muted-foreground text-sm">Your password has been successfully changed. Redirecting to login...</p>
              </div>
              <Button asChild className="w-full h-11 text-base mt-6">
                <Link to="/login">Login Now</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 relative">
                <Label htmlFor="password" className="text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 text-foreground bg-background ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                <div className="space-y-1 mt-3 p-3 bg-muted/50 rounded-lg border border-border/50">
                  <p className="text-xs font-medium text-foreground mb-2">Password requirements:</p>
                  <ul className="text-xs space-y-1.5">
                    {requirements.map((req, idx) => (
                      <li key={idx} className={`flex items-center ${req.met ? 'text-success' : 'text-muted-foreground'}`}>
                        {req.met ? (
                          <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-current mr-2 opacity-50" />
                        )}
                        {req.label}
                      </li>
                    ))}
                  </ul>
                </div>
                {errors.password && <p className="text-sm text-destructive font-medium">{errors.password.message}</p>}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`pl-10 pr-10 text-foreground bg-background ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    {...register('confirmPassword')}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-destructive font-medium mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div className="space-y-4 pt-4">
                <Button
                  type="submit"
                  className="w-full h-11 text-base shadow-sm"
                  disabled={isSubmitting || !isValid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Saving Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>

                <Button asChild variant="ghost" className="w-full h-11 text-muted-foreground hover:text-foreground">
                  <Link to="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
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
