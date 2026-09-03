import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {
  XCircle,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function CancelPage() {
  const [searchParams] = useSearchParams();
  const params = useParams();

  const bookingId =
    params.id ||
    searchParams.get('id') ||
    searchParams.get('booking_id') ||
    searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(!!bookingId);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refundStatus, setRefundStatus] = useState(null);

  useEffect(() => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const record = await pb
          .collection('bookings')
          .getOne(bookingId, { $autoCancel: false });
        setBooking(record);
        setRefundStatus(record.refund_status || null);
      } catch (err) {
        console.error('Failed to fetch booking for cancellation:', err);
        setError('Booking not found or could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleRequestCancellation = async () => {
    if (!booking) return;

    setIsSubmitting(true);
    try {
      const updated = await pb
        .collection('bookings')
        .update(
          booking.id,
          {
            refund_status: 'requested',
          },
          { $autoCancel: false },
        );
      setBooking(updated);
      setRefundStatus('requested');
      toast.success('Cancellation request submitted successfully.');
    } catch (err) {
      console.error('Failed to request cancellation:', err);
      toast.error('Failed to submit cancellation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const policyText =
    booking?.cancellation_policy ||
    booking?.cancellationPolicyText ||
    'flexible';

  const isNonRefundable =
    policyText.toLowerCase().includes('non_refundable') ||
    policyText.toLowerCase().includes('non-refundable') ||
    booking?.rateType === 'non_refundable';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Booking Cancellation | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full mx-auto">
          {loading ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-border p-8 shadow-sm">
              <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading booking details...</p>
            </div>
          ) : error ? (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <XCircle className="w-16 h-16 text-destructive mx-auto" />
              <h1 className="text-2xl font-bold font-serif">Unable to Load Booking</h1>
              <p className="text-muted-foreground">{error}</p>
              <div className="pt-2 flex justify-center gap-4">
                <Button asChild variant="outline">
                  <Link to="/guest/bookings">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    My Bookings
                  </Link>
                </Button>
                <Button asChild>
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          ) : booking ? (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-6">
              <div className="text-center border-b border-border pb-6">
                <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">
                  Cancel Booking
                </h1>
                <p className="text-sm text-muted-foreground">
                  Confirmation #{booking.id}
                </p>
              </div>

              <div className="bg-muted/30 p-5 rounded-xl text-sm space-y-3 border border-border/50">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Accommodation</span>
                  <span className="font-semibold text-foreground">
                    {booking.accommodationType || booking.room_type || 'Room'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> Dates
                  </span>
                  <span className="font-medium text-foreground">
                    {booking.check_in_date} to {booking.check_out_date}
                  </span>
                </div>
                {booking.final_price != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-4 h-4" /> Total Price
                    </span>
                    <span className="font-medium text-foreground">
                      €{Number(booking.final_price).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-border p-5 space-y-3">
                <h3 className="font-semibold text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                  Cancellation Policy
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed capitalize">
                  {policyText}
                </p>
              </div>

              {refundStatus === 'requested' ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl text-center space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-300">
                    Cancellation Requested
                  </h4>
                  <p className="text-sm text-emerald-800/80 dark:text-emerald-400/80">
                    Your cancellation request has been received and is being processed.
                  </p>
                </div>
              ) : isNonRefundable ? (
                <div className="bg-destructive/10 border border-destructive/20 p-5 rounded-xl text-center space-y-2">
                  <XCircle className="w-8 h-8 text-destructive mx-auto" />
                  <h4 className="font-semibold text-destructive">
                    Non-Refundable Booking
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    This booking is non-refundable. No refund is due if the booking is cancelled.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <Button
                    onClick={handleRequestCancellation}
                    disabled={isSubmitting}
                    variant="destructive"
                    className="w-full h-12 text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting Request...
                      </>
                    ) : (
                      'Request Cancellation'
                    )}
                  </Button>
                </div>
              )}

              <div className="pt-2 text-center">
                <Button asChild variant="ghost">
                  <Link to="/guest/bookings">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Return to My Bookings
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <h1 className="text-3xl font-bold font-serif text-foreground">
                Payment Cancelled
              </h1>
              <p className="text-muted-foreground">
                Your payment was not completed. No charges were made to your account.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                <Button asChild className="h-12">
                  <Link to="/booking">Try Booking Again</Link>
                </Button>
                <Button asChild variant="outline" className="h-12">
                  <Link to="/contact">Contact Support</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}