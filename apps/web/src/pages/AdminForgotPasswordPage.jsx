import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import apiServerClient from '@/lib/apiServerClient.js';

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address format'),
});

export default function AdminForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch('/admin-password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to request password reset');
      }

      setIsSuccess(true);
      toast.success('Reset email sent successfully');
    } catch (error) {
      console.error('Password reset request error:', error);
      toast.error(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 relative overflow-hidden">
      <Helmet>
        <title>Forgot Password | Admin Portal</title>
      </Helmet>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -z-10 rounded-b-[50%] blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 -z-10 rounded-full blur-3xl" />

      <Card className="w-full max-w-md shadow-2xl border-border/50 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto w-14 h-14 bg-primary rounded-xl flex items-center justify-center mb-2 shadow-lg">
            <span className="font-serif text-3xl font-bold text-primary-foreground">H</span>
          </div>
          <CardTitle className="font-serif text-3xl font-bold text-foreground">Reset Password</CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Enter your admin email address to receive reset instructions.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-foreground">Check your inbox</h3>
                <p className="text-muted-foreground text-sm">
                  We've sent password reset instructions to your email. The link will expire in 24 hours.
                </p>
              </div>
              <Button asChild variant="outline" className="w-full h-11 text-base mt-4 border-border text-foreground hover:bg-muted">
                <Link to="/admin/login">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Return to Login
                </Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2 relative">
                <Label htmlFor="email" className="text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@hotel.com"
                    className={`pl-10 text-foreground bg-background ${errors.email ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    {...register('email')}
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive font-medium mt-1">{errors.email.message}</p>
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
                      Sending Instructions...
                    </>
                  ) : (
                    'Send Reset Email'
                  )}
                </Button>
                
                <Button asChild variant="ghost" className="w-full h-11 text-muted-foreground hover:text-foreground">
                  <Link to="/admin/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
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