import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      navigate('/');
      return;
    }

    const fetchBooking = async () => {
      try {
        const record = await pb.collection('bookings').getOne(bookingId, {
          $autoCancel: false,
        });

        if (record.payment_status === 'completed' && record.stripe_session_id) {
          navigate(`/success?session_id=${encodeURIComponent(record.stripe_session_id)}`);
          return;
        }

        setBooking(record);
      } catch (err) {
        console.error('Unable to load booking for payment:', err);
        toast.error('Booking not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate]);

  const handlePayment = async () => {
    if (!booking?.id) return;

    setProcessing(true);
    try {
      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Payment initialization failed');
      }

      // Keep the payment in the same browser tab so Stripe's success/cancel
      // redirects return to the same booking flow reliably.
      window.location.assign(data.url);
    } catch (err) {
      console.error('Unable to start Stripe checkout:', err);
      toast.error('Failed to start payment.', {
        description: err.message || 'Please try again.',
      });
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!booking) return null;

  const totalPrice = Number(booking.final_price || 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Payment | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-xl w-full px-4">
          <div className="bg-card border border-border p-8 rounded-2xl shadow-lg">
            <h1 className="text-3xl font-bold mb-8 text-center text-foreground font-serif">
              Finalize Your Booking
            </h1>

            <div className="space-y-4 mb-8 text-foreground/80 bg-muted/30 p-6 rounded-xl">
              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="font-medium">Room</span>
                <span>{booking.room_type}</span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="font-medium">Dates</span>
                <span>
                  {new Date(booking.check_in_date).toLocaleDateString()} -{' '}
                  {new Date(booking.check_out_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between border-b border-border/50 pb-3">
                <span className="font-medium">Guests</span>
                <span>
                  {booking.num_adults} Adults, {booking.num_children} Children
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="font-bold text-lg text-foreground">Total Due</span>
                <span className="font-bold text-lg text-primary">€{totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm text-muted-foreground mb-8 bg-accent/20 p-4 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-secondary" />
              <p>Your payment is secure and encrypted via Stripe.</p>
            </div>

            <Button
              onClick={handlePayment}
              disabled={processing || totalPrice <= 0}
              className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground h-14 text-lg rounded-none uppercase tracking-widest"
            >
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...
                </>
              ) : (
                'Pay Securely with Stripe'
              )}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
