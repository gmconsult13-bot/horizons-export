import React, { useMemo, useState } from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  Calendar,
  CreditCard,
  Home,
  ShieldCheck,
  Tag,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';

const readPendingBooking = () => {
  try {
    const storedValue = sessionStorage.getItem('pendingBooking');

    return storedValue ? JSON.parse(storedValue) : null;
  } catch {
    return null;
  }
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentGuest } = useGuestAuth();

  const [loading, setLoading] = useState(false);

  const checkoutState = useMemo(() => {
    if (
      location.state?.bookingData &&
      location.state?.priceData
    ) {
      return location.state;
    }

    return readPendingBooking();
  }, [location.state]);

  if (
    !checkoutState?.bookingData ||
    !checkoutState?.priceData
  ) {
    return <Navigate to="/booking" replace />;
  }

  const { bookingData, priceData } = checkoutState;

  const handleCheckout = async () => {
    setLoading(true);

    try {
      sessionStorage.setItem(
        'pendingBooking',
        JSON.stringify({
          bookingData,
          priceData,
        }),
      );

      const response = await apiServerClient.fetch(
        '/stripe/create-checkout',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.round(priceData.totalPrice * 100),

            productName: `${bookingData.accommodationType} — ${bookingData.rateLabel} Rate`,

            successUrl:
              `${window.location.origin}` +
              '/booking/confirmation?session_id={CHECKOUT_SESSION_ID}',

            cancelUrl:
              `${window.location.origin}` +
              '/booking/checkout?payment_cancelled=1',

            guestEmail: currentGuest?.email || '',

            rateType: bookingData.rateType,

            cancellationPolicyCode:
              bookingData.cancellationPolicyCode,
          }),
        },
      );

      if (!response.ok) {
        const responseData = await response
          .json()
          .catch(() => ({}));

        throw new Error(
          responseData.error ||
            'Failed to initialize checkout.',
        );
      }

      const data = await response.json();

      if (!data.url) {
        throw new Error(
          'Stripe checkout URL was not returned.',
        );
      }

      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Checkout error:', error);

      toast.error('Failed to start payment process.', {
        description:
          error?.message || 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Checkout | Raya Boutique</title>
      </Helmet>

      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-10 text-center font-serif">
            Checkout Summary
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8">
              <section>
                <h2 className="text-2xl font-semibold border-b border-border pb-4 mb-4">
                  Booking Details
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Accommodation
                      </div>

                      <div className="font-medium">
                        {bookingData.accommodationType}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Dates
                      </div>

                      <div className="font-medium">
                        {bookingData.checkInDate} to{' '}
                        {bookingData.checkOutDate}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Guests
                      </div>

                      <div className="font-medium">
                        {bookingData.numberOfAdults} Adults,{' '}
                        {bookingData.numberOfChildren} Children
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {bookingData.rateType ===
                      'non_refundable' ? (
                        <Tag className="w-5 h-5 text-primary" />
                      ) : (
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      )}
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Selected Rate
                      </div>

                      <div className="font-medium">
                        {bookingData.rateLabel}
                      </div>

                      <p className="text-xs text-muted-foreground mt-2">
                        {bookingData.cancellationPolicyText}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {currentGuest && (
                <section>
                  <h3 className="text-xl font-semibold border-b border-border pb-4 mb-4">
                    Guest Details
                  </h3>

                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="text-muted-foreground">
                      Name
                    </div>
                    <div className="font-medium text-right">
                      {currentGuest.name || 'Not provided'}
                    </div>

                    <div className="text-muted-foreground">
                      Email
                    </div>
                    <div
                      className="font-medium text-right truncate"
                      title={currentGuest.email}
                    >
                      {currentGuest.email}
                    </div>

                    <div className="text-muted-foreground">
                      Phone
                    </div>
                    <div className="font-medium text-right">
                      {currentGuest.phone || 'Not provided'}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="bg-muted/30 p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-center">
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Standard total
                  </span>

                  <span>
                    €
                    {priceData.standardTotalPrice.toFixed(2)}
                  </span>
                </div>

                {priceData.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>
                      Discount ({priceData.discountPercent}%)
                    </span>

                    <span>
                      −€{priceData.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="text-muted-foreground text-center mb-2 text-lg">
                Total Amount Due
              </div>

              <div className="text-6xl font-bold text-primary text-center mb-8">
                €{priceData.totalPrice.toFixed(2)}
              </div>

              <p className="text-sm text-muted-foreground text-center mb-8 px-4">
                You will be redirected to Stripe to complete your
                secure payment in euros.
              </p>

              <Button
                className="w-full h-14 text-lg"
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? (
                  'Processing...'
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pay with Stripe
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                className="w-full mt-4 h-12"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Back to Review
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}