import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { DiningCard } from '@/components/DiningCard.jsx';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { RefreshCcw } from 'lucide-react';

export default function DiningPage() {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState('all');

  const fetchDining = async () => {
    setLoading(true);
    setError(false);
    try {
      const records = await pb.collection('dining').getFullList({ sort: 'created', $autoCancel: false });
      setOptions(records);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDining(); }, []);

  const cuisines = ['all', ...new Set(options.map(o => o.cuisine_type).filter(Boolean))];
  const filteredOptions = filter === 'all' ? options : options.filter(o => o.cuisine_type === filter);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Dining | Raya Boutique</title></Helmet>
      <Header />
      
      <main className="flex-grow">
        {/* Hero */}
        <section className="bg-secondary text-secondary-foreground py-24 px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">Dining at Raya Boutique</h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90">Experience culinary excellence with our locally sourced, botanically inspired menus across diverse settings.</p>
        </section>

        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1,2,3].map(i => <Skeleton key={i} className="h-96 rounded-2xl" />)}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <p className="text-destructive mb-4">We couldn't load the dining options.</p>
              <Button onClick={fetchDining} variant="outline"><RefreshCcw className="w-4 h-4 mr-2"/> Retry</Button>
            </div>
          ) : (
            <>
              {cuisines.length > 1 && (
                <div className="flex flex-wrap gap-2 justify-center mb-12">
                  {cuisines.map(c => (
                    <Button 
                      key={c} 
                      variant={filter === c ? "default" : "outline"}
                      onClick={() => setFilter(c)}
                      className={`capitalize ${filter === c ? 'bg-primary text-primary-foreground' : ''}`}
                    >
                      {c}
                    </Button>
                  ))}
                </div>
              )}
              
              {filteredOptions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredOptions.map(item => <DiningCard key={item.id} item={item} />)}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">No dining options found.</p>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}