import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, LogIn, LogOut, BedDouble, Users, Clock, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function PMSFrontDesk() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ arrivals: [], departures: [], in_house: [], summary: {} });

  const fetchFrontDesk = async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch('/pms/front-desk/today');
      if (!res.ok) throw new Error('Failed to load front desk data');
      const result = await res.json();
      setData(result);
    } catch (error) {
      console.error('Front desk fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFrontDesk();
  }, []);

  const handleCheckIn = async (bookingId) => {
    try {
      await apiServerClient.fetch(`/pms/bookings/${bookingId}/check-in`, { method: 'POST' });
      fetchFrontDesk();
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      await apiServerClient.fetch(`/pms/bookings/${bookingId}/check-out`, { method: 'POST' });
      fetchFrontDesk();
    } catch (error) {
      console.error('Check-out error:', error);
    }
  };

  const StatCard = ({ icon: Icon, label, count, color }) => (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <div className="text-3xl font-bold text-foreground">{count}</div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
    </div>
  );

  const BookingCard = ({ booking, onAction, actionLabel, actionIcon: Icon, actionColor }) => (
    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-foreground">{booking.guest_name}</h4>
          <div className="text-sm text-muted-foreground space-y-0.5 mt-1">
            <div className="flex items-center gap-1"><Clock className="w-3 h-3" /> {booking.check_in} → {booking.check_out}</div>
            <div className="flex items-center gap-1"><BedDouble className="w-3 h-3" /> {booking.room_type}</div>
            {booking.num_children > 0 && (
              <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {booking.num_adults} adults, {booking.num_children} children</div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
            {booking.booking_source || 'direct'}
          </span>
          <div className="mt-2 font-bold text-primary">€{(booking.final_price || 0).toFixed(2)}</div>
        </div>
      </div>
      {booking.guest_email && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Mail className="w-3 h-3" /> {booking.guest_email}
        </div>
      )}
      {booking.guest_phone && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Phone className="w-3 h-3" /> {booking.guest_phone}
        </div>
      )}
      {onAction && (
        <Button
          size="sm"
          className={`w-full mt-2 ${actionColor || ''}`}
          onClick={() => onAction(booking.id)}
        >
          {Icon && <Icon className="w-4 h-4 mr-1" />}
          {actionLabel}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Front Desk | Raya Boutique PMS</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Front Desk</h1>
            <p className="text-muted-foreground mt-1">{new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard icon={LogIn} label="Arrivals Today" count={data.summary?.arrivals_count || 0} color="bg-amber-500" />
            <StatCard icon={LogOut} label="Departures Today" count={data.summary?.departures_count || 0} color="bg-purple-500" />
            <StatCard icon={BedDouble} label="In House Now" count={data.summary?.in_house_count || 0} color="bg-blue-500" />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Arrivals */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-amber-500" />
                  Arrivals ({data.arrivals.length})
                </h2>
                <div className="space-y-3">
                  {data.arrivals.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No arrivals today</p>
                  ) : (
                    data.arrivals.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onAction={b.booking_status !== 'checked_in' ? handleCheckIn : null}
                        actionLabel="Check In"
                        actionIcon={LogIn}
                        actionColor="bg-amber-500 hover:bg-amber-600"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Departures */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-purple-500" />
                  Departures ({data.departures.length})
                </h2>
                <div className="space-y-3">
                  {data.departures.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No departures today</p>
                  ) : (
                    data.departures.map(b => (
                      <BookingCard
                        key={b.id}
                        booking={b}
                        onAction={b.booking_status === 'checked_in' ? handleCheckOut : null}
                        actionLabel="Check Out"
                        actionIcon={LogOut}
                        actionColor="bg-purple-500 hover:bg-purple-600"
                      />
                    ))
                  )}
                </div>
              </div>

              {/* In House */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-blue-500" />
                  In House ({data.in_house.length})
                </h2>
                <div className="space-y-3">
                  {data.in_house.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No guests in house</p>
                  ) : (
                    data.in_house.map(b => (
                      <BookingCard key={b.id} booking={b} />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
