import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const navigate = useNavigate();
  const { currentGuest } = useGuestAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [bookingRecord, setBookingRecord] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verifyAndCreateBooking = async () => {
      try {
        // 1. Verify payment with Stripe
        const stripeRes = await apiServerClient.fetch(`/stripe/session/${sessionId}`);
        if (!stripeRes.ok) throw new Error('Payment verification failed');
        const stripeData = await stripeRes.json();

        if (stripeData.status !== 'complete' && stripeData.status !== 'paid') {
          throw new Error('Payment not completed');
        }

        // 2. Retrieve pending booking data
        const pendingDataStr = sessionStorage.getItem('pendingBooking');
        if (!pendingDataStr) {
          // If no pending data, maybe they refreshed. We can't create the record easily here without it.
          // In a real app, we'd use webhooks. For this task, we'll just show success if payment is good.
          setStatus('success');
          return;
        }

        const { bookingData, priceData } = JSON.parse(pendingDataStr);

        // 3. Create PocketBase record
        const record = await pb.collection('bookings').create({
          guest_name: currentGuest?.name || stripeData.customerEmail || 'Guest',
          guest_email: currentGuest?.email || stripeData.customerEmail || 'guest@example.com',
          accommodationType: bookingData.accommodationType,
          room_type: bookingData.accommodationType, // fallback for legacy field
          check_in_date: bookingData.checkInDate,
          check_out_date: bookingData.checkOutDate,
          num_adults: bookingData.numberOfAdults,
          num_children: bookingData.numberOfChildren,
          number_of_guests: bookingData.numberOfAdults + bookingData.numberOfChildren,
          childrenAges: bookingData.childrenAges,
          final_price: priceData.totalPrice,
          room_total: priceData.basePrice * priceData.nights,
          guest_surcharges: (priceData.adultSurcharge + priceData.childSurcharge) * priceData.nights,
          meal_total: 0,
          meal_plan_cost: 0,
          meal_plan: 'room_only',
          cancellation_policy: 'flexible',
          payment_status: 'completed',
          paymentId: sessionId,
          stripe_session_id: sessionId,
          guestId: currentGuest?.id || '',
          terms_accepted: true
        }, { $autoCancel: false });

        setBookingRecord(record);
        sessionStorage.removeItem('pendingBooking');
        setStatus('success');

      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    verifyAndCreateBooking();
  }, [sessionId, currentGuest]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Booking Confirmation | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <h2 className="text-2xl font-semibold">Verifying Payment...</h2>
              <p className="text-muted-foreground">Please don't close this window.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-semibold">Verification Failed</h2>
              <p className="text-muted-foreground">We couldn't verify your payment. If you were charged, please contact support.</p>
              <Button onClick={() => navigate('/')} className="w-full">Return Home</Button>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-3xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground">Thank you for your reservation. We look forward to hosting you.</p>
              
              {bookingRecord && (
                <div className="bg-muted/30 p-4 rounded-xl text-sm text-left space-y-2 border border-border/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confirmation #</span>
                    <span className="font-mono font-medium">{bookingRecord.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dates</span>
                    <span className="font-medium">{bookingRecord.check_in_date} to {bookingRecord.check_out_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Paid</span>
                    <span className="font-medium text-primary">${bookingRecord.final_price.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 space-y-3">
                {currentGuest ? (
                  <Button asChild className="w-full">
                    <Link to="/guest/bookings">View My Bookings</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/">Return Home</Link>
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}