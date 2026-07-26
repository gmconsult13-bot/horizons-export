import React, {
  useMemo,
  useState,
} from 'react';

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
  Loader2,
  Percent,
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

const formatMoney = (value) =>
  Number(value || 0).toFixed(2);

const readPendingBooking = () => {
  try {
    const storedValue =
      sessionStorage.getItem(
        'pendingBooking',
      );

    return storedValue
      ? JSON.parse(storedValue)
      : null;
  } catch (error) {
    console.error(
      'Failed to read pending booking:',
      error,
    );

    return null;
  }
};

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const { currentGuest } =
    useGuestAuth();

  const [loading, setLoading] =
    useState(false);

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
    return (
      <Navigate
        to="/booking"
        replace
      />
    );
  }

  const {
    bookingData,
    priceData,
  } = checkoutState;

  const dealDiscountAmount = Number(
    priceData.dealDiscountAmount || 0,
  );

  const dealDiscountPercent = Number(
    priceData.dealDiscountPercent || 0,
  );

  const rateDiscountAmount = Number(
    priceData.rateDiscountAmount ??
      priceData.discountAmount ??
      0,
  );

  const rateDiscountPercent = Number(
    priceData.rateDiscountPercent ??
      priceData.discountPercent ??
      0,
  );

  const totalDiscountAmount = Number(
    priceData.totalDiscountAmount ??
      dealDiscountAmount +
        rateDiscountAmount,
  );

  const hasDeal =
    bookingData.dealApplied === true &&
    dealDiscountAmount > 0;

  const isNonRefundable =
    bookingData.rateType ===
    'non_refundable';

  const handleCheckout = async () => {
    if (loading) {
      return;
    }

    setLoading(true);

    try {
      sessionStorage.setItem(
        'pendingBooking',
        JSON.stringify({
          bookingData,
          priceData,
        }),
      );

      const productParts = [
        bookingData.accommodationType,
        bookingData.rateLabel
          ? `${bookingData.rateLabel} Rate`
          : null,
        hasDeal
          ? bookingData.dealTitle
          : null,
      ].filter(Boolean);

      const response =
        await apiServerClient.fetch(
          '/stripe/create-checkout',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json',
            },

            body: JSON.stringify({
              amount: Math.round(
                Number(
                  priceData.totalPrice,
                ) * 100,
              ),

              productName:
                productParts.join(' — '),

              successUrl:
                `${window.location.origin}` +
                '/booking/confirmation?session_id={CHECKOUT_SESSION_ID}',

              cancelUrl:
                `${window.location.origin}` +
                '/booking/checkout?payment_cancelled=1',

              guestEmail:
                currentGuest?.email || '',

              rateType:
                bookingData.rateType,

              cancellationPolicyCode:
                bookingData.cancellationPolicyCode,
            }),
          },
        );

      const responseData =
        await response
          .json()
          .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            'Failed to initialize checkout.',
        );
      }

      if (!responseData.url) {
        throw new Error(
          'Stripe checkout URL was not returned.',
        );
      }

      window.open(
        responseData.url,
        '_blank',
        'noopener,noreferrer',
      );
    } catch (error) {
      console.error(
        'Checkout error:',
        error,
      );

      toast.error(
        'Failed to start payment process.',
        {
          description:
            error?.message ||
            'Please try again.',
        },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Checkout | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-10 text-center font-serif">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8">
              <section>
                <h2 className="text-2xl font-semibold border-b border-border pb-4 mb-5">
                  Stay Details
                </h2>

                <div className="space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>

                    <div>
                      <div className="text-sm text-muted-foreground">
                        Accommodation
                      </div>

                      <div className="font-medium">
                        {
                          bookingData.accommodationType
                        }
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
                        {
                          bookingData.checkInDate
                        }
                        {' to '}
                        {
                          bookingData.checkOutDate
                        }
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
                        {
                          bookingData.numberOfAdults
                        }{' '}
                        Adult
                        {Number(
                          bookingData.numberOfAdults,
                        ) !== 1
                          ? 's'
                          : ''}
                        ,{' '}
                        {
                          bookingData.numberOfChildren
                        }{' '}
                        Child
                        {Number(
                          bookingData.numberOfChildren,
                        ) !== 1
                          ? 'ren'
                          : ''}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {isNonRefundable ? (
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
                        {
                          bookingData.rateLabel
                        }
                      </div>

                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        {
                          bookingData.cancellationPolicyText
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {hasDeal && (
                <section>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                    <div className="flex items-start gap-3">
                      <Percent className="w-6 h-6 text-primary shrink-0 mt-0.5" />

                      <div>
                        <p className="text-sm font-medium text-primary">
                          Selected Offer
                        </p>

                        <h3 className="text-xl font-semibold mt-1">
                          {bookingData.dealTitle ||
                            'Special Offer'}
                        </h3>

                        <p className="text-sm text-muted-foreground mt-2">
                          {
                            dealDiscountPercent
                          }
                          % discount has
                          been applied.
                        </p>

                        {isNonRefundable && (
                          <p className="text-sm text-emerald-700 mt-2 font-medium">
                            This offer is
                            combined with the
                            additional 10%
                            Non-refundable
                            discount.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

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
                      {currentGuest.name ||
                        'Not provided'}
                    </div>

                    <div className="text-muted-foreground">
                      Email
                    </div>

                    <div
                      className="font-medium text-right truncate"
                      title={
                        currentGuest.email
                      }
                    >
                      {currentGuest.email ||
                        'Not provided'}
                    </div>

                    <div className="text-muted-foreground">
                      Phone
                    </div>

                    <div className="font-medium text-right">
                      {currentGuest.phone ||
                        'Not provided'}
                    </div>
                  </div>
                </section>
              )}
            </div>

            <div className="bg-muted/30 p-8 rounded-2xl shadow-sm border border-border flex flex-col">
              <h2 className="text-2xl font-semibold mb-6">
                Booking Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    Standard total
                  </span>

                  <span>
                    €
                    {formatMoney(
                      priceData.standardTotalPrice,
                    )}
                  </span>
                </div>

                {hasDeal && (
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <span>
                      {bookingData.dealTitle ||
                        'Offer'}{' '}
                      (
                      {
                        dealDiscountPercent
                      }
                      %)
                    </span>

                    <span>
                      −€
                      {formatMoney(
                        dealDiscountAmount,
                      )}
                    </span>
                  </div>
                )}

                {hasDeal &&
                  priceData.priceAfterDeal !==
                    undefined && (
                    <div className="flex justify-between gap-4 text-muted-foreground">
                      <span>
                        Price after offer
                      </span>

                      <span>
                        €
                        {formatMoney(
                          priceData.priceAfterDeal,
                        )}
                      </span>
                    </div>
                  )}

                {rateDiscountAmount >
                  0 && (
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <span>
                      Non-refundable
                      discount (
                      {
                        rateDiscountPercent
                      }
                      %)
                    </span>

                    <span>
                      −€
                      {formatMoney(
                        rateDiscountAmount,
                      )}
                    </span>
                  </div>
                )}

                {totalDiscountAmount >
                  0 && (
                  <div className="border-t border-border pt-4 flex justify-between gap-4 font-semibold text-emerald-700">
                    <span>
                      Total discount
                    </span>

                    <span>
                      −€
                      {formatMoney(
                        totalDiscountAmount,
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-5 flex justify-between gap-4 font-bold text-lg">
                  <span>
                    Final Price
                  </span>

                  <span className="text-primary">
                    €
                    {formatMoney(
                      priceData.totalPrice,
                    )}
                  </span>
                </div>
              </div>

              <div className="mt-10 text-center">
                <div className="text-muted-foreground mb-2 text-lg">
                  Total Amount Due
                </div>

                <div className="text-5xl sm:text-6xl font-bold text-primary mb-8">
                  €
                  {formatMoney(
                    priceData.totalPrice,
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-8 px-2">
                  You will be redirected to
                  Stripe to complete your
                  secure payment in euros.
                </p>

                <Button
                  type="button"
                  className="w-full h-14 text-lg"
                  onClick={
                    handleCheckout
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />

                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />

                      Pay with Stripe
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full mt-4 h-12"
                  onClick={() =>
                    navigate(-1)
                  }
                  disabled={loading}
                >
                  Back to Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}