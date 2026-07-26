import React from 'react';

import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import { Helmet } from 'react-helmet';

import {
  BadgeEuro,
  Percent,
  ShieldCheck,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';

import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const formatMoney = (value) =>
  Number(value || 0).toFixed(2);

export default function BookingReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  if (
    !location.state?.bookingData ||
    !location.state?.priceData
  ) {
    return <Navigate to="/booking" replace />;
  }

  const { bookingData, priceData } =
    location.state;

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>
          Review Booking | Raya Boutique
        </title>
      </Helmet>

      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-10 text-center font-serif">
            Review Your Booking
          </h1>

          <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4">
                Stay Details
              </h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-muted-foreground">
                  Accommodation
                </div>

                <div className="font-medium text-right">
                  {
                    bookingData.accommodationType
                  }
                </div>

                <div className="text-muted-foreground">
                  Check-in
                </div>

                <div className="font-medium text-right">
                  {bookingData.checkInDate}
                </div>

                <div className="text-muted-foreground">
                  Check-out
                </div>

                <div className="font-medium text-right">
                  {bookingData.checkOutDate}
                </div>

                <div className="text-muted-foreground">
                  Guests
                </div>

                <div className="font-medium text-right">
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
            </section>

            {hasDeal && (
              <section className="border-t border-border pt-6">
                <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
                  <div className="flex items-start gap-3">
                    <Percent className="w-6 h-6 text-primary shrink-0 mt-0.5" />

                    <div>
                      <p className="text-sm font-medium text-primary">
                        Selected Offer
                      </p>

                      <h2 className="text-xl font-semibold mt-1">
                        {bookingData.dealTitle ||
                          'Special Offer'}
                      </h2>

                      <p className="text-sm text-muted-foreground mt-2">
                        {dealDiscountPercent}%
                        discount has been applied
                        to your stay.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="border-t border-border pt-6">
              <div className="flex items-start gap-3">
                {isNonRefundable ? (
                  <Tag className="w-6 h-6 text-primary mt-1 shrink-0" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-primary mt-1 shrink-0" />
                )}

                <div>
                  <h2 className="text-2xl font-semibold">
                    {bookingData.rateLabel}{' '}
                    Rate
                  </h2>

                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {
                      bookingData.cancellationPolicyText
                    }
                  </p>

                  {hasDeal &&
                    isNonRefundable && (
                      <p className="text-sm text-emerald-700 mt-3 font-medium">
                        The offer discount and
                        the additional 10%
                        Non-refundable discount
                        are combined.
                      </p>
                    )}
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-6">
              <h2 className="text-2xl font-semibold mb-5">
                Booking Summary
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    Base rate (
                    {priceData.nights} nights)
                  </span>

                  <span>
                    €
                    {formatMoney(
                      Number(
                        priceData.basePrice ||
                          0,
                      ) *
                        Number(
                          priceData.nights ||
                            0,
                        ),
                    )}
                  </span>
                </div>

                {Number(
                  priceData.adultSurcharge ||
                    0,
                ) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Adult surcharge
                    </span>

                    <span>
                      €
                      {formatMoney(
                        Number(
                          priceData.adultSurcharge,
                        ) *
                          Number(
                            priceData.nights,
                          ),
                      )}
                    </span>
                  </div>
                )}

                {Number(
                  priceData.childSurcharge ||
                    0,
                ) > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Child surcharge
                    </span>

                    <span>
                      €
                      {formatMoney(
                        Number(
                          priceData.childSurcharge,
                        ) *
                          Number(
                            priceData.nights,
                          ),
                      )}
                    </span>
                  </div>
                )}

                {Number(
                  priceData.seasonMultiplier ||
                    1,
                ) !== 1 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      Seasonal adjustment
                    </span>

                    <span>
                      ×
                      {
                        priceData.seasonMultiplier
                      }
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between gap-4 font-medium">
                  <span>
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
                      ({dealDiscountPercent}%)
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

                {rateDiscountAmount > 0 && (
                  <div className="flex justify-between gap-4 text-emerald-700">
                    <span>
                      Non-refundable discount
                      ({rateDiscountPercent}%)
                    </span>

                    <span>
                      −€
                      {formatMoney(
                        rateDiscountAmount,
                      )}
                    </span>
                  </div>
                )}

                {totalDiscountAmount > 0 && (
                  <div className="border-t border-border pt-3 flex justify-between gap-4 font-semibold text-emerald-700">
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

                <div className="border-t border-border pt-4 mt-3 flex justify-between items-center gap-4 font-bold text-lg">
                  <span>
                    Final Price
                  </span>

                  <span className="text-primary flex items-center">
                    <BadgeEuro className="w-5 h-5 mr-1" />

                    {formatMoney(
                      priceData.totalPrice,
                    )}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Back to Edit
              </Button>

              <Button
                type="button"
                className="w-full"
                onClick={() =>
                  navigate(
                    '/booking/checkout',
                    {
                      state:
                        location.state,
                    },
                  )
                }
              >
                Continue to Checkout
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}