import React from 'react';
import {
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  BadgeEuro,
  ShieldCheck,
  Tag,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function BookingReviewPage() {
  const location = useLocation();
  const navigate = useNavigate();

  if (
    !location.state?.bookingData ||
    !location.state?.priceData
  ) {
    return <Navigate to="/booking" replace />;
  }

  const { bookingData, priceData } = location.state;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Review Booking | Raya Boutique</title>
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
                  {bookingData.accommodationType}
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
                  {bookingData.numberOfAdults} Adults,{' '}
                  {bookingData.numberOfChildren} Children
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-6">
              <div className="flex items-start gap-3">
                {bookingData.rateType === 'non_refundable' ? (
                  <Tag className="w-6 h-6 text-primary mt-1" />
                ) : (
                  <ShieldCheck className="w-6 h-6 text-primary mt-1" />
                )}

                <div>
                  <h2 className="text-2xl font-semibold">
                    {bookingData.rateLabel} Rate
                  </h2>

                  <p className="text-sm text-muted-foreground mt-2">
                    {bookingData.cancellationPolicyText}
                  </p>
                </div>
              </div>
            </section>

            <section className="border-t border-border pt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Price Breakdown
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Base rate ({priceData.nights} nights)
                  </span>

                  <span>
                    €
                    {(
                      priceData.basePrice * priceData.nights
                    ).toFixed(2)}
                  </span>
                </div>

                {priceData.adultSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Adult surcharge
                    </span>

                    <span>
                      €
                      {(
                        priceData.adultSurcharge *
                        priceData.nights
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                {priceData.childSurcharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Child surcharge
                    </span>

                    <span>
                      €
                      {(
                        priceData.childSurcharge *
                        priceData.nights
                      ).toFixed(2)}
                    </span>
                  </div>
                )}

                {priceData.seasonMultiplier !== 1 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Seasonal adjustment
                    </span>

                    <span>
                      ×{priceData.seasonMultiplier}
                    </span>
                  </div>
                )}

                <div className="border-t border-border pt-3 flex justify-between">
                  <span>Standard total</span>

                  <span>
                    €
                    {priceData.standardTotalPrice.toFixed(2)}
                  </span>
                </div>

                {priceData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between text-emerald-700">
                      <span>
                        Non-refundable discount (
                        {priceData.discountPercent}%)
                      </span>

                      <span>
                        −€
                        {priceData.discountAmount.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <div className="border-t border-border pt-4 mt-3 flex justify-between items-center font-bold text-lg">
                  <span>Total Price</span>

                  <span className="text-primary flex items-center">
                    <BadgeEuro className="w-5 h-5 mr-1" />
                    {priceData.totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </section>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate(-1)}
              >
                Back to Edit
              </Button>

              <Button
                className="w-full"
                onClick={() =>
                  navigate('/booking/checkout', {
                    state: location.state,
                  })
                }
              >
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}