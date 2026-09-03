import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCcw } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import RoomCard from '@/components/RoomCard.jsx';
import { fetchPublicRooms } from '@/services/publicRoomsService.js';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const fetchRooms = async () => {
    setLoading(true);
    setError(false);
    try {
      const result = await fetchPublicRooms();
      setRooms(result.rooms);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleBookClick = (room) => {
    navigate(`/booking?room=${encodeURIComponent(room.name)}`);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Rooms & Suites | Raya Boutique</title>
        <meta name="description" content="Explore our luxurious accommodations, from cozy Economy rooms to expansive Suites." />
      </Helmet>

      <Header />

      <main className="flex-grow py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-foreground mb-6 font-serif">Our Accommodations</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find your perfect sanctuary. Each space is carefully crafted to offer deep comfort and quiet elegance.
            </p>
          </div>

          <section className="mb-20 w-full">
            <h2 className="text-3xl font-serif font-bold text-foreground mb-12 text-center">Distinctive Accommodations</h2>
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-[32rem] rounded-2xl" />
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-destructive mb-4 text-lg">We couldn't load the available rooms at this time.</p>
                <Button onClick={fetchRooms} variant="outline" className="h-12 px-6">
                  <RefreshCcw className="w-4 h-4 mr-2" /> Retry
                </Button>
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rooms.map((room) => (
                  <RoomCard key={room.id} room={room} onBookClick={handleBookClick} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground text-lg mb-4">No rooms are currently available.</p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
