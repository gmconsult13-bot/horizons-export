import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function GuestRegistrationPage() {
  const navigate = useNavigate();
  const { register, login } = useGuestAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    passwordConfirm: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email address format';
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    else if (!/^\+?[\d\s-]{8,20}$/.test(formData.phone)) newErrors.phone = 'Invalid phone number format';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters long';
    
    if (formData.password !== formData.passwordConfirm) {
      newErrors.passwordConfirm = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('[RegistrationForm] Initiating registration flow...');
      
      // Step 1: Create the guest record
      await register(formData.email, formData.password, formData.phone);
      console.log('[RegistrationForm] Guest created. Attempting auto-login...');
      
      // Step 2: Automatically log them in
      await login(formData.email, formData.password);
      console.log('[RegistrationForm] Auto-login successful.');
      
      toast.success('Registration successful!', {
        description: 'Welcome to your account.'
      });
      
      // Step 3: Redirect to guest dashboard
      navigate('/guest/dashboard');
      
    } catch (error) {
      console.error('[RegistrationForm] Flow failed:', error);
      
      // Parse detailed error messages from PocketBase
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.email?.message) {
          errorMessage = `Email: ${errorData.email.message}`;
        } else if (errorData.password?.message) {
          errorMessage = `Password: ${errorData.password.message}`;
        } else if (errorData.passwordConfirm?.message) {
          errorMessage = `Password Confirm: ${errorData.passwordConfirm.message}`;
        } else if (errorData.phone?.message) {
          errorMessage = `Phone: ${errorData.phone.message}`;
        }
      } else if (error.response?.message) {
        errorMessage = error.response.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error('Registration Failed', {
        description: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Register | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">Create an Account</h1>
            <p className="text-muted-foreground text-sm">
              Join us to manage your bookings and enjoy exclusive perks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="maya@example.com"
                value={formData.email}
                onChange={handleChange}
                className={`text-foreground bg-background ${errors.email ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.email && <p className="text-xs text-destructive font-medium">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={handleChange}
                className={`text-foreground bg-background ${errors.phone ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.phone && <p className="text-xs text-destructive font-medium">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className={`text-foreground bg-background ${errors.password ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.password && <p className="text-xs text-destructive font-medium">{errors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm" className="text-foreground">Confirm Password</Label>
              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                placeholder="••••••••"
                value={formData.passwordConfirm}
                onChange={handleChange}
                className={`text-foreground bg-background ${errors.passwordConfirm ? "border-destructive" : ""}`}
                disabled={isSubmitting}
              />
              {errors.passwordConfirm && <p className="text-xs text-destructive font-medium">{errors.passwordConfirm}</p>}
            </div>

            <Button 
              type="submit" 
              className="w-full mt-6 h-11 text-base transition-all duration-200 active:scale-[0.98]"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Register <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/guest/login" className="text-primary font-medium hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}