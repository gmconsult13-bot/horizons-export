import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function BookingConfirmationPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('verifying');
  const [paymentData, setPaymentData] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verifyPayment = async () => {
      try {
        const response = await apiServerClient.fetch(
          `/stripe/session/${encodeURIComponent(sessionId)}`,
        );
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Payment verification failed');
        }

        setPaymentData(data);
        setStatus(data.status === 'paid' ? 'success' : 'pending');
      } catch (error) {
        console.error('Confirmation error:', error);
        setStatus('error');
      }
    };

    verifyPayment();
  }, [sessionId]);

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

          {(status === 'error' || status === 'pending') && (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-semibold">
                {status === 'pending' ? 'Payment Pending' : 'Verification Failed'}
              </h2>
              <p className="text-muted-foreground">
                {status === 'pending'
                  ? 'Your payment is not marked as completed yet. If you were charged, please contact us and provide the booking reference.'
                  : "We couldn't verify your payment. If you were charged, please contact support."}
              </p>
              <Button asChild className="w-full">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border text-center space-y-6">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="text-3xl font-bold text-foreground">Booking Confirmed!</h2>
              <p className="text-muted-foreground">
                Thank you for your reservation. A confirmation email has been sent to{' '}
                {paymentData?.customerEmail || 'your email address'}.
              </p>

              <div className="bg-muted/30 p-4 rounded-xl text-sm text-left space-y-2 border border-border/50">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Booking reference</span>
                  <span className="font-mono font-medium">{paymentData?.bookingId || '-'}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-medium text-primary">Paid</span>
                </div>
                {Number.isFinite(Number(paymentData?.amountTotal)) && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Total paid</span>
                    <span className="font-medium">€{(Number(paymentData.amountTotal) / 100).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 space-y-3">
                <Button asChild className="w-full">
                  <Link to="/guest/bookings">View My Bookings</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Return Home</Link>
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
