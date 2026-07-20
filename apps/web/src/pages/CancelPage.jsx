import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

export default function CancelPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Payment Cancelled | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow flex items-center justify-center py-24">
        <div className="max-w-md w-full px-4 text-center">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4 font-serif">Payment Cancelled</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your payment was not completed. No charges were made to your account. Your booking is currently on hold.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 h-12">
              <Link to="/booking">Try Again</Link>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <Link to="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}