import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import ReviewCard from '@/components/ReviewCard.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

const ITEMS_PER_PAGE = 10;

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await apiServerClient.fetch('/reviews/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Failed to load stats', err);
    }
  };

  const fetchReviews = async (pageNum, append = false) => {
    if (append) setIsFetchingMore(true);
    else setLoading(true);
    
    setError(null);
    try {
      const offset = (pageNum - 1) * ITEMS_PER_PAGE;
      const response = await apiServerClient.fetch(`/reviews?limit=${ITEMS_PER_PAGE}&offset=${offset}`);
      
      if (!response.ok) throw new Error('Failed to load reviews');
      
      const data = await response.json();
      
      if (append) {
        setReviews(prev => [...prev, ...data.reviews]);
      } else {
        setReviews(data.reviews);
      }
      
      setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchReviews(1);
  }, []);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(nextPage, true);
  };

  const calculateOverallRating = () => {
    if (!stats) return 0;
    const { avg_hotel_rating, avg_cleaning_rating, avg_service_rating, avg_food_rating, avg_price_quality_rating } = stats;
    return ((avg_hotel_rating + avg_cleaning_rating + avg_service_rating + avg_food_rating + avg_price_quality_rating) / 5).toFixed(1);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Guest Reviews | Raya Boutique</title>
        <meta name="description" content="Read authentic reviews from guests who have stayed at Raya Boutique Hotel." />
      </Helmet>
      
      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold font-serif text-foreground mb-6">Guest Experiences</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Authentic feedback from our cherished guests. We pride ourselves on continuous improvement and uncompromising service.
            </p>
          </div>

          {/* Stats Section */}
          {stats && stats.total_reviews > 0 && (
            <div className="bg-card border rounded-3xl p-8 md:p-12 shadow-sm mb-16 max-w-4xl mx-auto">
              <div className="flex flex-col items-center justify-center mb-10">
                <div className="text-6xl font-bold font-serif text-foreground mb-4 tabular-nums">
                  {calculateOverallRating()} <span className="text-3xl text-muted-foreground">/ 6</span>
                </div>
                <div className="flex gap-1 mb-2">
                  {[1, 2, 3, 4, 5, 6].map((star) => (
                    <Star key={star} className={`w-8 h-8 ${star <= Math.round(calculateOverallRating()) ? 'star-filled' : 'star-empty'}`} />
                  ))}
                </div>
                <p className="text-muted-foreground font-medium">Based on {stats.total_reviews} verified reviews</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <StatBar label="Hotel & Room" value={stats.avg_hotel_rating} />
                <StatBar label="Cleanliness" value={stats.avg_cleaning_rating} />
                <StatBar label="Service & Staff" value={stats.avg_service_rating} />
                <StatBar label="Food & Dining" value={stats.avg_food_rating} />
                <StatBar label="Value for Money" value={stats.avg_price_quality_rating} className="md:col-span-2 md:w-1/2 md:mx-auto" />
              </div>
            </div>
          )}

          {/* Reviews List */}
          {loading && page === 1 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-72 w-full rounded-2xl break-inside-avoid" />
              ))}
            </div>
          ) : error && page === 1 ? (
            <div className="text-center py-16 bg-destructive/10 rounded-2xl border border-destructive/20 text-destructive">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <p className="text-lg font-medium">We couldn't load the reviews.</p>
              <Button onClick={() => fetchReviews(1)} variant="outline" className="mt-4 border-destructive/30 hover:bg-destructive/10">
                Try Again
              </Button>
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {reviews.map((review) => (
                  <div key={review.id} className="break-inside-avoid">
                    <ReviewCard review={review} />
                  </div>
                ))}
              </div>

              {page < totalPages && (
                <div className="mt-16 text-center">
                  <Button 
                    onClick={loadMore} 
                    disabled={isFetchingMore}
                    variant="outline"
                    size="lg"
                    className="h-14 px-8 rounded-full shadow-sm bg-card hover:bg-muted"
                  >
                    {isFetchingMore ? (
                      <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading...</>
                    ) : (
                      'Load More Reviews'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20 bg-muted/30 rounded-2xl border">
              <p className="text-xl text-muted-foreground">No reviews have been published yet.</p>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}

function StatBar({ label, value, className = "" }) {
  const percentage = (value / 6) * 100;
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm font-medium">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{value.toFixed(1)}</span>
      </div>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}