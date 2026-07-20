import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Lock, ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
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

export default function AdminResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setErrorMessage('Password reset token is missing from the link.');
        setIsVerifying(false);
        return;
      }

      try {
        const response = await apiServerClient.fetch('/admin-password-reset/verify-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Invalid or expired token');
        }

        setIsValidToken(true);
      } catch (error) {
        setErrorMessage(error.message || 'Invalid or expired password reset link.');
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
      const response = await apiServerClient.fetch('/admin-password-reset/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successfully');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/admin/login');
      }, 2000);
      
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 relative overflow-hidden">
      <Helmet>
        <title>Create New Password | Admin Portal</title>
      </Helmet>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -z-10 rounded-b-[50%] blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 -z-10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-lg">
            <span className="font-serif text-3xl font-bold text-primary-foreground">H</span>
          </div>
          <CardTitle className="font-serif text-3xl font-bold text-foreground">Set New Password</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Create a strong password for your admin account.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isVerifying ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
              <p className="text-muted-foreground font-medium">Verifying link...</p>
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
              <Button asChild variant="outline" className="w-full h-11 text-base mt-4 border-border text-foreground hover:bg-muted">
                <Link to="/admin/forgot-password">
                  Request New Link
                </Link>
              </Button>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Password Reset</h3>
                <p className="text-muted-foreground text-sm">
                  Your admin password has been successfully updated. Redirecting to login...
                </p>
              </div>
              <Button asChild className="w-full h-11 text-base mt-4 bg-primary text-primary-foreground">
                <Link to="/admin/login">
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
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 text-foreground bg-background ${errors.password ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    {...register('password')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive font-medium mt-1">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="confirmPassword" className="text-foreground">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    className={`pl-10 text-foreground bg-background ${errors.confirmPassword ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    {...register('confirmPassword')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive font-medium mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="space-y-4 pt-2">
                <Button 
                  type="submit" 
                  className="w-full h-11 text-base bg-primary text-primary-foreground hover:bg-primary/90 shadow-md" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Resetting Password...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
                
                <Button asChild variant="ghost" className="w-full h-11 text-muted-foreground hover:text-foreground">
                  <Link to="/admin/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Cancel
                  </Link>
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}