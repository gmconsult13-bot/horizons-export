import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Calendar, Percent, Sparkles, ArrowRight, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveDeals = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const records = await pb.collection('guest_deals').getFullList({
          filter: `is_active = true && end_date >= "${today} 00:00:00.000Z"`,
          sort: 'end_date',
          $autoCancel: false
        });
        setDeals(records);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActiveDeals();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Helmet>
        <title>Special Offers & Deals | Raya Boutique</title>
        <meta name="description" content="Discover our exclusive offers, seasonal promotions, and special deals for your perfect stay at Raya Boutique." />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-secondary/30"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary/5 via-background to-background pointer-events-none"></div>
        
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold tracking-wide uppercase mb-6">
              <Sparkles className="h-4 w-4" /> Exclusive Offers
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight font-serif text-balance">
              Unforgettable Stays,<br /> Unbeatable Value
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
              Elevate your experience with our carefully curated promotional packages. Book directly with us to unlock these limited-time perks.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Prominent Phone Contact Banner */}
      <section className="relative -mt-12 z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-background rounded-3xl p-1.5 shadow-2xl border border-border"
        >
          <div className="bg-card rounded-[1.35rem] p-6 sm:p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left shadow-inner border border-muted">
            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-[hsl(var(--phone-highlight))]/10 flex items-center justify-center">
                <Phone className="w-8 h-8 animate-bounce" style={{ color: 'hsl(var(--phone-highlight))' }} />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-foreground mb-2">
                  Call for Special Deals
                </h2>
                <p className="text-muted-foreground text-lg max-w-md">
                  Contact us directly for unlisted, exclusive offers tailored just for you!
                </p>
              </div>
            </div>
            
            <a 
              href="tel:+359884443484"
              className="group relative inline-flex items-center justify-center w-full md:w-auto px-8 py-4 bg-[hsl(var(--phone-highlight))]/5 hover:bg-[hsl(var(--phone-highlight))]/10 rounded-full transition-colors duration-300"
            >
              <span 
                className="animate-blink text-3xl sm:text-4xl font-extrabold tracking-tight" 
                style={{ color: 'hsl(var(--phone-highlight))' }}
              >
                +359 88 444 3484
              </span>
            </a>
          </div>
        </motion.div>
      </section>

      {/* Prominent Deals Vertical Stack */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col gap-16 md:gap-24">
            {[1, 2].map((i) => (
              <Card key={i} className="w-full max-w-5xl mx-auto rounded-[2rem] border-0 shadow-2xl overflow-hidden">
                <Skeleton className="w-full aspect-[4/3] sm:aspect-video md:aspect-[21/9]" />
                <CardContent className="p-8 sm:p-12 lg:p-16 flex flex-col items-center">
                  <Skeleton className="h-14 w-48 rounded-full -mt-16 sm:-mt-20 relative z-10 border-4 border-card mb-8" />
                  <Skeleton className="h-12 w-3/4 max-w-2xl mb-6" />
                  <Skeleton className="h-6 w-full max-w-3xl mb-4" />
                  <Skeleton className="h-6 w-2/3 max-w-2xl mb-10" />
                  <Skeleton className="h-12 w-64 rounded-full mb-10" />
                  <Skeleton className="h-14 w-56 rounded-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-2xl mx-auto text-center py-20 px-6 rounded-[2rem] bg-secondary/30 border border-border/50 shadow-sm"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-background shadow-md mb-8 text-muted-foreground">
              <Percent className="h-10 w-10" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4 font-serif">No Active Deals Right Now</h2>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              We are currently preparing new exciting offers. Please check back soon or browse our standard room rates.
            </p>
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-full text-lg">
              <Link to="/rooms">View Our Rooms</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-16 md:gap-24 items-center">
            {deals.map((deal) => (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="w-full max-w-5xl"
              >
                <Card className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-shadow duration-500 rounded-[2rem] bg-card">
                  {/* Huge Focal Image */}
                  <div className="relative w-full aspect-[4/3] sm:aspect-video md:aspect-[21/9] overflow-hidden bg-muted">
                    {deal.image ? (
                      <img 
                        src={pb.files.getURL(deal, deal.image)} 
                        alt={deal.title}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Percent className="h-24 w-24 opacity-10" />
                      </div>
                    )}
                    {/* Subtle gradient overlay to ensure badge contrast if it overlaps the image on mobile */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                  </div>

                  {/* Centered Content Below Image */}
                  <CardContent className="flex flex-col items-center text-center p-8 sm:p-12 lg:p-16 relative">
                    
                    {/* Overlapping Prominent Badge */}
                    <div className="-mt-14 sm:-mt-20 mb-8 relative z-10">
                      <span className="inline-flex items-center justify-center font-bold tracking-wide shadow-xl bg-primary text-primary-foreground border-4 border-card rounded-full px-6 py-2 sm:px-8 sm:py-3 text-xl sm:text-2xl">
                        {deal.discount_percentage}% OFF
                      </span>
                    </div>

                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground mb-6 font-serif text-balance">
                      {deal.title}
                    </h2>
                    
                    {deal.description && (
                      <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed text-balance">
                        {deal.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-base font-medium mb-12 bg-secondary/50 px-6 py-3 rounded-full text-secondary-foreground">
                      <Calendar className="h-5 w-5 text-primary" />
                      Valid until {new Date(deal.end_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </div>

                    <Button asChild size="lg" className="w-full sm:w-auto h-14 px-10 rounded-full text-lg shadow-md group/btn transition-transform hover:-translate-y-1">
                      <Link to="/booking">
                        Book This Deal
                        <ArrowRight className="ml-3 h-5 w-5 transition-transform group-hover/btn:translate-x-1.5" />
                      </Link>
                    </Button>
                    
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}