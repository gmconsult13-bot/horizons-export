import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { Wifi, Coffee, Wind, UtensilsCrossed, RefreshCcw, Star, MapPin, Wine as Wine2 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RoomCard from '@/components/RoomCard.jsx';
import ReviewCard from '@/components/ReviewCard.jsx';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';

export default function HomePage() {
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [errorRooms, setErrorRooms] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const navigate = useNavigate();

  const fetchFeaturedRooms = async () => {
    setLoadingRooms(true);
    setErrorRooms(false);
    try {
      const result = await pb.collection('rooms').getList(1, 3, {
        sort: 'price',
        $autoCancel: false
      });
      setFeaturedRooms(result.items || []);
    } catch (err) {
      console.error('Failed to fetch featured rooms:', err);
      setErrorRooms(true);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchReviewsData = async () => {
    try {
      const [statsRes, reviewsRes] = await Promise.all([
        apiServerClient.fetch('/reviews/stats'),
        apiServerClient.fetch('/reviews?limit=5&offset=0')
      ]);
      if (statsRes.ok && reviewsRes.ok) {
        const statsData = await statsRes.json();
        const reviewsData = await reviewsRes.json();
        setReviewStats(statsData.stats);
        setReviews(reviewsData.reviews || []);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchFeaturedRooms();
    fetchReviewsData();
  }, []);

  const handleBookClick = room => {
    navigate(`/booking?room=${encodeURIComponent(room.name)}`);
  };

  const calculateOverallRating = () => {
    if (!reviewStats) return 0;
    const {
      avg_hotel_rating,
      avg_cleaning_rating,
      avg_service_rating,
      avg_food_rating,
      avg_price_quality_rating
    } = reviewStats;
    return ((avg_hotel_rating + avg_cleaning_rating + avg_service_rating + avg_food_rating + avg_price_quality_rating) / 5).toFixed(1);
  };

  return <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Raya Boutique | Luxury Hotel & Retreat</title>
        <meta name="description" content="Experience unparalleled luxury and botanical serenity at Raya Boutique Hotel." />
      </Helmet>

      <Header />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center">
          <div className="absolute inset-0 z-0">
            <img src="https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/viber_d-d-d3-4d-nddegdpdud1-2d-du_2026-06-04_14-36-48-252-jvcVW.jpg" alt="Luxury boutique hotel interior with warm lighting" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          </div>

          <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <motion.h1 initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8
          }} className="text-5xl md:text-7xl font-bold text-white mb-6 font-serif">
              LUXURY COMES TO YOU
            </motion.h1>
            <motion.p initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.2
          }} className="text-lg md:text-2xl text-white/90 mb-10 font-light max-w-2xl mx-auto">
              Discover botanical serenity and contemporary luxury in our meticulously curated spaces.
            </motion.p>
            <motion.div initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }} transition={{
            duration: 0.8,
            delay: 0.4
          }}>
              <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 py-6 rounded-none uppercase tracking-widest">
                <Link to="/booking">Reserve Your Stay</Link>
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Featured Rooms Section */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4 font-serif">Featured Accommodations</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Thoughtfully designed spaces that blend natural elements with uncompromising comfort.
              </p>
            </div>

            {loadingRooms ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-[32rem] rounded-2xl" />)}
              </div> : errorRooms ? <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-destructive mb-4 text-lg">We couldn't load the featured rooms at this time.</p>
                <Button onClick={fetchFeaturedRooms} variant="outline" className="h-12 px-6">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div> : featuredRooms.length > 0 ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredRooms.map(room => <RoomCard key={room.id} room={room} onBookClick={handleBookClick} />)}
              </div> : <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground text-lg mb-4">No rooms are currently available.</p>
              </div>}

            <div className="mt-16 text-center">
              <Button asChild variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-none uppercase tracking-widest">
                <Link to="/rooms">View All Rooms</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Amenities - Bento Grid */}
        <section className="py-24 bg-accent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-accent-foreground mb-16 text-center font-serif">Curated Amenities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
              <div className="md:col-span-2 bg-card rounded-2xl p-8 shadow-sm flex flex-col justify-center relative overflow-hidden group">
                <div className="relative z-10 text-card-foreground">
                  <UtensilsCrossed className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-2xl font-semibold mb-2">Buffet Dining</h3>
                  <p className="text-card-foreground/70 max-w-md">Experience culinary excellence with our locally sourced, botanically inspired menus available at our signature restaurant.</p>
                </div>
                <div className="absolute right-0 bottom-0 opacity-5 group-hover:opacity-10 transition-opacity">
                  <UtensilsCrossed className="w-64 h-64" />
                </div>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-sm flex flex-col justify-center text-card-foreground">
                <Wifi className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">High-Speed Connectivity</h3>
                <p className="text-sm text-card-foreground/70">Seamless and fast internet access throughout the entire property.</p>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-sm flex flex-col justify-center text-card-foreground">
                <Coffee className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Premium Coffee</h3>
                <p className="text-sm text-card-foreground/70">Premium coffee capsule in the room.</p>
              </div>

              <div className="bg-card rounded-2xl p-8 shadow-sm flex flex-col justify-center text-card-foreground">
                <Wine2 className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Free Minibar</h3>
                <p className="text-sm text-card-foreground/70">Complimentary selection of premium beverages and refreshments.</p>
              </div>

              <div className="md:col-span-2 bg-card rounded-2xl p-8 shadow-sm flex flex-col justify-center text-card-foreground">
                <MapPin className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Top Location&nbsp;</h3>
                <p className="text-card-foreground/70 max-w-md">The property is in the central part of Sunny Beach, close to the beach, the bus station, discotheques and bars</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="py-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-6 font-serif">Guest Experiences</h2>
              
              {reviewStats && reviewStats.total_reviews > 0 && <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center gap-2 bg-muted/50 px-6 py-3 rounded-full">
                    <span className="text-3xl font-bold font-serif text-foreground">
                      {calculateOverallRating()}
                    </span>
                    <span className="text-muted-foreground text-lg">/ 6</span>
                    <div className="w-px h-8 bg-border mx-4"></div>
                    <div className="flex -space-x-1 mr-2">
                      {[1, 2, 3, 4, 5, 6].map(star => <Star key={star} className={`w-5 h-5 ${star <= Math.round(calculateOverallRating()) ? 'star-filled' : 'star-empty'}`} />)}
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Based on {reviewStats.total_reviews} reviews
                    </span>
                  </div>
                </div>}
            </div>

            {loadingReviews ? <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl break-inside-avoid" />)}
              </div> : reviews.length > 0 ? <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                {reviews.map(review => <div key={review.id} className="break-inside-avoid">
                    <ReviewCard review={review} />
                  </div>)}
              </div> : <div className="text-center py-12 text-muted-foreground">
                <p>No reviews yet. Be the first to share your experience!</p>
              </div>}

            <div className="mt-16 text-center">
              <Button asChild variant="outline" size="lg" className="rounded-none uppercase tracking-widest">
                <Link to="/reviews">Read All Reviews</Link>
              </Button>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>;
}