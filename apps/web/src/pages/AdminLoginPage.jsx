import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AdminLoginPage() {
  const { login, isAuthenticated, isInitialized } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      console.log('[AdminLoginPage] User is already authenticated, redirecting to /admin');
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    console.log('[AdminLoginPage] Form submit triggered');
    console.log('[AdminLoginPage] Login attempt started for email:', email);
    console.log('[AdminLoginPage] Sending password of length:', password.length);
    
    if (!email || !password) {
      setErrorMsg('Email and password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('[AdminLoginPage] Calling adminAuth.login()...');
      const user = await login(email, password);
      console.log('[AdminLoginPage] Login response received - SUCCESS:', user);
      
      const from = location.state?.from?.pathname || '/admin';
      console.log('[AdminLoginPage] Redirecting to:', from);
      navigate(from, { replace: true });
    } catch (error) {
      console.error('[AdminLoginPage] Login error caught in component:', error);
      setErrorMsg(error.message || 'An unexpected error occurred during login.');
    } finally {
      setIsSubmitting(false);
      console.log('[AdminLoginPage] Form submission completed');
    }
  };

  // Don't render until we've checked localStorage
  if (!isInitialized) return null;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background px-4 sm:px-6 relative overflow-hidden">
      <Helmet>
        <title>Admin Login | Raya Portal</title>
      </Helmet>

      {/* Decorative background blobs */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-primary/5 -z-10 rounded-b-[50%] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 -z-10 rounded-full blur-3xl pointer-events-none" />

      <Card className="w-full max-w-md shadow-xl border-border/40 bg-card/95 backdrop-blur">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <span className="font-serif text-3xl font-bold text-primary-foreground">R</span>
          </div>
          <div className="space-y-1">
            <CardTitle className="font-serif text-3xl font-bold text-foreground">Admin Portal</CardTitle>
            <CardDescription className="text-muted-foreground text-base">
              Sign in to manage Raya Boutique Hotels
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {errorMsg && (
              <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Login Failed</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rayaboutique.com"
                  className="pl-10 text-foreground"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 text-foreground"
                  disabled={isSubmitting}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-11 text-base font-medium transition-all duration-200 hover:bg-primary/90 active:scale-[0.98]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In to Dashboard'
              )}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-center border-t border-border/40 pt-6">
           <p className="text-sm text-muted-foreground">
             Secured access for authorized personnel only.
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}