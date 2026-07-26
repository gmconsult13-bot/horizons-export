import React, { useState } from 'react';
import {
  useNavigate,
  Link,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function GuestRegistrationPage() {
  const navigate = useNavigate();
  const { register } = useGuestAuth();

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    passwordConfirm: '',
  });

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email.trim(),
      )
    ) {
      newErrors.email =
        'Invalid email address format';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (
      !/^\+?[\d\s()-]{8,25}$/.test(
        formData.phone.trim(),
      )
    ) {
      newErrors.phone =
        'Invalid phone number format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password =
        'Password must be at least 8 characters';
    } else if (
      !/[A-Z]/.test(formData.password)
    ) {
      newErrors.password =
        'Password must contain an uppercase letter';
    } else if (
      !/[a-z]/.test(formData.password)
    ) {
      newErrors.password =
        'Password must contain a lowercase letter';
    } else if (
      !/[0-9]/.test(formData.password)
    ) {
      newErrors.password =
        'Password must contain a number';
    }

    if (!formData.passwordConfirm) {
      newErrors.passwordConfirm =
        'Please confirm your password';
    } else if (
      formData.password !==
      formData.passwordConfirm
    ) {
      newErrors.passwordConfirm =
        'Passwords do not match';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: '',
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error(
        'Please correct the highlighted fields.',
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await register({
        email: formData.email,
        password: formData.password,
        passwordConfirm:
          formData.passwordConfirm,
        phone: formData.phone,
      });

      toast.success(
        'Registration successful!',
        {
          description:
            'Please check your email and verify your account before logging in.',
        },
      );

      navigate('/login', {
        replace: true,
        state: {
          registeredEmail:
            formData.email
              .trim()
              .toLowerCase(),
          verificationRequired: true,
        },
      });
    } catch (error) {
      console.error(
        'Guest registration failed:',
        error,
      );

      const errorData =
        error?.response?.data || {};

      const emailMessage =
        errorData?.email?.message || '';

      const phoneMessage =
        errorData?.phone?.message || '';

      const emailAlreadyExists =
        emailMessage.toLowerCase().includes('unique') ||
        emailMessage.toLowerCase().includes('already');

      const phoneAlreadyExists =
        phoneMessage.toLowerCase().includes('unique') ||
        phoneMessage.toLowerCase().includes('already');

      if (
        emailAlreadyExists &&
        phoneAlreadyExists
      ) {
        setErrors({
          email:
            'This email address is already registered.',
          phone:
            'This phone number is already registered.',
        });

        toast.error(
          'Account already exists',
          {
            description:
              'An account with this email address and phone number already exists. Please log in instead.',
            action: {
              label: 'Log in',
              onClick: () =>
                navigate('/login'),
            },
          },
        );

        return;
      }

      if (emailAlreadyExists) {
        setErrors({
          email:
            'This email address is already registered.',
        });

        toast.error(
          'Email already registered',
          {
            description:
              'An account with this email already exists. Please log in or use the forgot password option.',
            action: {
              label: 'Log in',
              onClick: () =>
                navigate('/login'),
            },
          },
        );

        return;
      }

      if (phoneAlreadyExists) {
        setErrors({
          phone:
            'This phone number is already registered.',
        });

        toast.error(
          'Phone number already registered',
          {
            description:
              'Please use another phone number or contact the hotel for assistance.',
          },
        );

        return;
      }

      let errorMessage =
        'Registration could not be completed. Please try again.';

      if (errorData?.password?.message) {
        errorMessage =
          errorData.password.message;
      } else if (
        errorData?.passwordConfirm?.message
      ) {
        errorMessage =
          errorData.passwordConfirm.message;
      } else if (
        error?.response?.message
      ) {
        errorMessage =
          error.response.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error('Registration failed', {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Register | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full bg-card p-8 rounded-2xl shadow-lg border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">
              Create an Account
            </h1>

            <p className="text-muted-foreground text-sm">
              Register to manage your
              bookings and guest profile.
            </p>
          </div>

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
                className={
                  errors.email
                    ? 'border-destructive'
                    : ''
                }
              />

              {errors.email && (
                <p className="text-xs text-destructive font-medium">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number
              </Label>

              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="+359 88 123 4567"
                value={formData.phone}
                onChange={handleChange}
                disabled={isSubmitting}
                className={
                  errors.phone
                    ? 'border-destructive'
                    : ''
                }
              />

              {errors.phone && (
                <p className="text-xs text-destructive font-medium">
                  {errors.phone}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password
              </Label>

              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isSubmitting}
                className={
                  errors.password
                    ? 'border-destructive'
                    : ''
                }
              />

              {errors.password && (
                <p className="text-xs text-destructive font-medium">
                  {errors.password}
                </p>
              )}

              <p className="text-xs text-muted-foreground">
                Use at least 8 characters,
                including uppercase, lowercase
                and a number.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">
                Confirm Password
              </Label>

              <Input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={
                  formData.passwordConfirm
                }
                onChange={handleChange}
                disabled={isSubmitting}
                className={
                  errors.passwordConfirm
                    ? 'border-destructive'
                    : ''
                }
              />

              {errors.passwordConfirm && (
                <p className="text-xs text-destructive font-medium">
                  {errors.passwordConfirm}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Register
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Log in here
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}