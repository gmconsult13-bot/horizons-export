import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Loader2, LogOut, ArrowLeft, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import BookingCard from '@/components/BookingCard.jsx';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';

export default function GuestProfilePage() {
  const { currentGuest, logout } = useGuestAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = async () => {
    if (!currentGuest?.id) return;
    try {
      const records = await pb.collection('bookings').getList(1, 100, {
        filter: `guest_id="${currentGuest.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setBookings(records.items);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load your bookings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentGuest]);

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      await pb.collection('bookings').delete(bookingId, { $autoCancel: false });
      toast.success('Booking cancelled successfully.');
      fetchBookings();
    } catch (error) {
      console.error('Failed to delete booking:', error);
      toast.error('Failed to cancel booking. Please contact support.');
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  const unfinishedBookings = bookings
    .filter(b => b.check_in_date > today)
    .sort((a, b) => new Date(b.created) - new Date(a.created)); // Newest first
    
  const completedBookings = bookings
    .filter(b => b.check_in_date <= today)
    .sort((a, b) => new Date(a.created) - new Date(b.created)); // Oldest first

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>My Profile | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center mb-4 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>
            <h1 className="text-4xl font-bold font-serif text-foreground">My Profile</h1>
          </div>
          <Button variant="outline" onClick={logout} className="shrink-0">
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border sticky top-28">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-6 text-foreground">Account Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Name</div>
                  <div className="font-medium text-foreground">{currentGuest?.name || 'Not provided'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Email</div>
                  <div className="font-medium text-foreground break-all">{currentGuest?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Phone</div>
                  <div className="font-medium text-foreground">{currentGuest?.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Area */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-6 text-foreground">My Bookings</h2>
            
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <Tabs defaultValue="unfinished" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="unfinished">Upcoming ({unfinishedBookings.length})</TabsTrigger>
                  <TabsTrigger value="completed">Past ({completedBookings.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="unfinished" className="space-y-6">
                  {unfinishedBookings.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-border border-dashed">
                      <p className="text-muted-foreground">You have no upcoming bookings.</p>
                      <Button asChild className="mt-4">
                        <Link to="/booking">Book a Room</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {unfinishedBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          booking={booking} 
                          isUnfinished={true} 
                          onDelete={handleDeleteBooking} 
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="completed" className="space-y-6">
                  {completedBookings.length === 0 ? (
                    <div className="text-center py-12 bg-muted/30 rounded-2xl border border-border border-dashed">
                      <p className="text-muted-foreground">You have no past bookings.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {completedBookings.map(booking => (
                        <BookingCard 
                          key={booking.id} 
                          booking={booking} 
                          isUnfinished={false} 
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}