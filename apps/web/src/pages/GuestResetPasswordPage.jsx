import React, { useState, useEffect } from 'react';
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
import apiServerClient from '@/lib/apiServerClient.js';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export default function GuestResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, watch, formState: { errors, isValid } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
    defaultValues: { password: '', confirmPassword: '' }
  });

  const watchPassword = watch('password');
  
  const requirements = [
    { label: 'At least 8 characters', met: watchPassword?.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(watchPassword || '') },
    { label: 'One lowercase letter', met: /[a-z]/.test(watchPassword || '') },
    { label: 'One number', met: /[0-9]/.test(watchPassword || '') },
  ];

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMessage('Token is invalid or has expired. Request a new password reset.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await apiServerClient.fetch('/password-reset/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok || data.valid === false) {
          throw new Error(data.error || 'Token is invalid or has expired. Request a new password reset.');
        }

        setIsValidToken(true);
      } catch (error) {
        setErrorMessage(error.message || 'Token is invalid or has expired. Request a new password reset.');
        setIsValidToken(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch('/password-reset/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });

      const resData = await response.json().catch(() => ({}));

      if (!response.ok || resData.error) {
        throw new Error(resData.error || 'Failed to update your password.');
      }

      setIsSuccess(true);
      toast.success('Password reset successfully!');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error('Unable to reset password.', {
        description: error.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Create New Password | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4 bg-muted/30">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border/50">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">Set New Password</h1>
            <p className="text-muted-foreground text-sm">
              Create a strong and secure password for your account.
            </p>
          </div>
          
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">Verifying secure link...</p>
            </div>
          ) : !isValidToken ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Link Invalid</h3>
                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto">
                  {errorMessage}
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-11 text-base mt-6">
                <Link to="/forgot-password">
                  Request New Link
                </Link>
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Password Updated</h3>
                <p className="text-muted-foreground text-sm">
                  Your password has been successfully changed. Redirecting to login...
                </p>
              </div>
              <Button asChild className="w-full h-11 text-base mt-6 transition-all active:scale-[0.98]">
                <Link to="/login">
                  Login Now
                </Link>
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
                    type={showPassword ? "text" : "password"}
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
                      <li key={idx} className={`flex items-center transition-colors ${req.met ? 'text-success' : 'text-muted-foreground'}`}>
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
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
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
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive font-medium mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-4 pt-4">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base shadow-sm transition-all duration-200 active:scale-[0.98]" 
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