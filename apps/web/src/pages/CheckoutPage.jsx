import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { CreditCard, Calendar, Users, Home } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';

export default function CheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { currentGuest } = useGuestAuth();
  
  if (!location.state || !location.state.bookingData || !location.state.priceData) {
    return <Navigate to="/booking" replace />;
  }

  const { bookingData, priceData } = location.state;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // Store booking data in sessionStorage to retrieve after successful payment
      sessionStorage.setItem('pendingBooking', JSON.stringify({
        bookingData,
        priceData
      }));

      // Ensure we call '/stripe/create-checkout' (apiServerClient will prepend '/hcgi/api')
      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(priceData.totalPrice * 100), // Convert to cents
          productName: `${bookingData.accommodationType} Booking`,
          successUrl: window.location.origin + '/booking/confirmation?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/booking/checkout'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize checkout');
      }

      const data = await response.json();
      // CRITICAL: Must use window.open with '_blank' to bypass iframe navigation issues
      window.open(data.url, '_blank');
      setLoading(false); // Reset loading state in case the user closes the popup and wants to retry
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start payment process. Please try again.');
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
          <h1 className="text-4xl font-bold mb-10 text-foreground text-center">Checkout Summary</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Booking & Guest Details */}
            <div className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8">
              <div>
                <h2 className="text-2xl font-semibold border-b border-border pb-4 mb-4">Booking Details</h2>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Accommodation</div>
                      <div className="font-medium text-foreground">{bookingData.accommodationType}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Dates</div>
                      <div className="font-medium text-foreground">{bookingData.checkInDate} to {bookingData.checkOutDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Guests</div>
                      <div className="font-medium text-foreground">{bookingData.numberOfAdults} Adults, {bookingData.numberOfChildren} Children</div>
                    </div>
                  </div>
                </div>
              </div>

              {currentGuest && (
                <div>
                  <h3 className="text-xl font-semibold border-b border-border pb-4 mb-4">Guest Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="text-muted-foreground">Name</div>
                    <div className="font-medium text-right text-foreground">{currentGuest.name || 'Not provided'}</div>
                    
                    <div className="text-muted-foreground">Email</div>
                    <div className="font-medium text-right text-foreground truncate" title={currentGuest.email}>
                      {currentGuest.email}
                    </div>
                    
                    <div className="text-muted-foreground">Phone</div>
                    <div className="font-medium text-right text-foreground">{currentGuest.phone || 'Not provided'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Summary */}
            <div className="bg-muted/30 p-8 rounded-2xl shadow-sm border border-border flex flex-col justify-center text-center">
              <div className="text-muted-foreground mb-2 text-lg">Total Amount Due</div>
              <div className="text-6xl font-bold text-primary mb-8">${priceData.totalPrice.toFixed(2)}</div>
              
              <p className="text-sm text-muted-foreground mb-8 px-4">
                You will be redirected to Stripe to complete your secure payment.
              </p>

              <Button 
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 active:scale-[0.98]" 
                onClick={handleCheckout}
                disabled={loading}
              >
                {loading ? 'Processing...' : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" /> Pay with Stripe
                  </>
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full mt-4 h-12 transition-all duration-300" 
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