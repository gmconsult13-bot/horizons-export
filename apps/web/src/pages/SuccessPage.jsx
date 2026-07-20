import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient';

export default function SuccessPage() {
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
        const response = await apiServerClient.fetch(`/stripe/session/${sessionId}`);
        if (!response.ok) throw new Error('Verification failed');
        
        const data = await response.json();
        setPaymentData(data);
        setStatus(data.status === 'complete' || data.status === 'paid' ? 'success' : 'pending');

        // Note: The backend already updates PB payment_status via webhook or during this endpoint.
        // We could call /bookings/send-confirmation here if we had the full booking data, 
        // but backend usually handles it via webhook.
      } catch (err) {
        setStatus('error');
      }
    };

    verifyPayment();
  }, [sessionId]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Booking Confirmed | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-24">
        <div className="max-w-md w-full px-4 text-center">
          {status === 'verifying' && (
            <div className="flex flex-col items-center">
              <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Verifying your payment...</p>
            </div>
          )}

          {status === 'success' && (
            <div>
              <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 font-serif">Booking Confirmed!</h1>
              <p className="text-lg text-muted-foreground mb-8">
                Thank you for choosing Raya Boutique. A confirmation email has been sent to {paymentData?.customerEmail || 'your email'}.
              </p>
              <div className="bg-card p-6 rounded-xl border border-border mb-8 shadow-sm">
                <p className="text-sm text-muted-foreground mb-2">Booking Reference</p>
                <p className="font-mono text-lg font-bold text-foreground tracking-wider">{sessionId.slice(-10).toUpperCase()}</p>
              </div>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8">
                <Link to="/">Return to Home</Link>
              </Button>
            </div>
          )}

          {(status === 'error' || status === 'pending') && (
            <div>
              <h1 className="text-3xl font-bold text-destructive mb-4 font-serif">Payment Status Unclear</h1>
              <p className="text-muted-foreground mb-8">
                We couldn't verify your payment status immediately. Please check your email or contact support if the amount was deducted.
              </p>
              <Button asChild variant="outline">
                <Link to="/contact">Contact Support</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}