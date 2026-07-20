import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Star, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function ReviewSubmitPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState(null);
  const [bookingData, setBookingData] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [ratings, setRatings] = useState({
    hotel_rating: 0,
    cleaning_rating: 0,
    service_rating: 0,
    food_rating: 0,
    price_quality_rating: 0,
  });
  const [opinion, setOpinion] = useState('');

  useEffect(() => {
    if (!bookingId || !token) {
      setValidationError('Missing review link parameters. Please use the link provided in your email.');
      setIsValidating(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await apiServerClient.fetch(`/reviews/validate-token?booking_id=${bookingId}&token=${token}`);
        const data = await response.json();

        if (!response.ok || !data.valid) {
          throw new Error(data.error || 'Invalid or expired review link.');
        }

        setBookingData(data);
      } catch (err) {
        setValidationError(err.message);
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [bookingId, token]);

  const handleRatingChange = (field, value) => {
    setRatings(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required ratings
    const missingRatings = Object.entries(ratings).filter(([_, val]) => val === 0);
    if (missingRatings.length > 0) {
      toast.error('Please provide a rating for all categories.');
      return;
    }

    if (opinion.length > 500) {
      toast.error('Opinion must be less than 500 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch('/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          guest_name: bookingData.guest_name,
          ...ratings,
          opinion: opinion.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review');
      }

      setIsSuccess(true);
      toast.success('Thank you for your review!');
      
      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err) {
      toast.error(err.message || 'Something went wrong.');
      setIsSubmitting(false);
    }
  };

  const RATING_CATEGORIES = [
    { key: 'hotel_rating', label: 'Hotel & Room Quality' },
    { key: 'cleaning_rating', label: 'Cleanliness' },
    { key: 'service_rating', label: 'Service & Staff' },
    { key: 'food_rating', label: 'Food & Dining' },
    { key: 'price_quality_rating', label: 'Value for Money' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Submit Review | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-16 flex items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          {isValidating ? (
            <Card className="p-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
              <p className="text-muted-foreground text-lg">Validating your review link...</p>
            </Card>
          ) : validationError ? (
            <Card className="p-12 text-center border-destructive/20 bg-destructive/5">
              <h2 className="text-2xl font-bold text-destructive mb-4">Unable to Load Review Form</h2>
              <p className="text-destructive/80 mb-6">{validationError}</p>
              <Button asChild variant="outline">
                <a href="/">Return to Homepage</a>
              </Button>
            </Card>
          ) : isSuccess ? (
            <Card className="p-12 text-center border-success/20 bg-success/5">
              <CheckCircle2 className="w-16 h-16 text-success mx-auto mb-6" />
              <h2 className="text-3xl font-bold font-serif text-success-foreground mb-4">Thank you for your feedback!</h2>
              <p className="text-success-foreground/80 text-lg mb-2">Your review has been successfully submitted.</p>
              <p className="text-muted-foreground">Redirecting to homepage...</p>
            </Card>
          ) : (
            <Card className="shadow-lg border-border">
              <CardHeader className="text-center bg-muted/30 border-b pb-8">
                <CardTitle className="text-3xl font-serif mt-2">Rate Your Experience</CardTitle>
                <CardDescription className="text-base mt-2">
                  Welcome back, <span className="font-semibold text-foreground">{bookingData?.guest_name}</span>. We'd love to hear about your stay!
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-8">
                <form onSubmit={handleSubmit} className="space-y-8">
                  
                  <div className="space-y-6 bg-card rounded-xl">
                    {RATING_CATEGORIES.map((cat) => (
                      <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b last:border-0 last:pb-0">
                        <Label className="text-base font-medium mb-3 sm:mb-0 text-foreground">{cat.label}</Label>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5, 6].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleRatingChange(cat.key, star)}
                              className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full"
                              aria-label={`Rate ${star} out of 6`}
                            >
                              <Star 
                                className={`w-8 h-8 transition-colors duration-200 ${star <= ratings[cat.key] ? 'star-filled' : 'star-empty hover:fill-muted'}`} 
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="flex justify-between items-baseline">
                      <Label htmlFor="opinion" className="text-base font-medium text-foreground">
                        Tell us more about your stay <span className="text-muted-foreground font-normal">(Optional)</span>
                      </Label>
                      <span className="text-xs text-muted-foreground">
                        {opinion.length}/500
                      </span>
                    </div>
                    <Textarea
                      id="opinion"
                      placeholder="What did you like the most? How could we improve?"
                      className="min-h-[120px] resize-y text-foreground bg-background"
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value.slice(0, 500))}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-14 text-lg mt-4 transition-all duration-200 active:scale-[0.98]"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Submitting Review...
                      </>
                    ) : 'Submit Review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}