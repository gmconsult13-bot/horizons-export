import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, Star, TrendingUp, ArrowRight, AlarmClock as CalendarLock, ListOrdered, LogOut } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

const toDateOnly = (date) => date.toISOString().slice(0, 10);

export default function AdminDashboard() {
  const { adminUser, adminLogout } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const monthStartText = toDateOnly(monthStart);
        const nextMonthStartText = toDateOnly(nextMonthStart);

        const [bookings, rooms, reviewsRes] = await Promise.all([
          pb.collection('bookings').getFullList({ sort: '-created', $autoCancel: false }),
          pb.collection('rooms').getFullList({ $autoCancel: false }),
          apiServerClient.fetch(`/reviews-analytics/summary?start_date=${monthStartText}&end_date=${toDateOnly(now)}`)
        ]);

        const monthlyBookings = bookings.filter((booking) => {
          const created = new Date(booking.created_at || booking.created);
          return !Number.isNaN(created.getTime()) && created >= monthStart && created < nextMonthStart;
        });

        const paidMonthlyBookings = monthlyBookings.filter(
          (booking) => booking.payment_status === 'completed'
        );
        const revenue = paidMonthlyBookings.reduce(
          (sum, booking) => sum + Number(booking.final_price || 0),
          0
        );

        const totalRooms = rooms.reduce(
          (sum, room) => sum + Number(room.total_rooms || room.available_rooms || 0),
          0
        );
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const roomNightsAvailable = totalRooms * daysInMonth;
        let occupiedRoomNights = 0;

        paidMonthlyBookings.forEach((booking) => {
          const checkIn = new Date(booking.check_in_date);
          const checkOut = new Date(booking.check_out_date);
          if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) return;
          const overlapStart = checkIn > monthStart ? checkIn : monthStart;
          const overlapEnd = checkOut < nextMonthStart ? checkOut : nextMonthStart;
          if (overlapEnd > overlapStart) {
            occupiedRoomNights += Math.ceil((overlapEnd - overlapStart) / 86400000);
          }
        });

        let reviewStats = null;
        if (reviewsRes.ok) reviewStats = await reviewsRes.json();

        setStats({
          revenue,
          occupancy: roomNightsAvailable > 0 ? (occupiedRoomNights / roomNightsAvailable) * 100 : 0,
          bookingsThisMonth: monthlyBookings.length,
          reviewsThisMonth: reviewStats?.total_reviews_this_month || reviewStats?.total_reviews || 0,
        });
        setRecentBookings(bookings.slice(0, 4));
      } catch (err) {
        console.error('Failed to load dashboard stats', err);
        setStats({ revenue: 0, occupancy: 0, bookingsThisMonth: 0, reviewsThisMonth: 0 });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const handleLogout = () => {
    adminLogout();
    navigate('/admin-login');
  };

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <AdminLayout>
      <Helmet><title>Dashboard | Admin Portal</title></Helmet>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">
            {greeting}, {adminUser?.name?.split(' ')[0] || 'Administrator'}
          </h1>
          <p className="text-muted-foreground mt-1">Live figures from the hotel database.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="shrink-0 bg-background hover:bg-muted">
          <LogOut className="w-4 h-4 mr-2" />Log Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard title="Revenue (Month)" value={`€${Number(stats?.revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} subtitle="Paid bookings this month" icon={CreditCard} loading={loading} />
        <MetricCard title="Occupancy Rate" value={`${Number(stats?.occupancy || 0).toFixed(1)}%`} subtitle="Paid room nights this month" icon={TrendingUp} loading={loading} />
        <MetricCard title="New Bookings" value={stats?.bookingsThisMonth || 0} subtitle="Created this month" icon={Calendar} loading={loading} />
        <MetricCard title="New Reviews" value={stats?.reviewsThisMonth || 0} subtitle="This month" icon={Star} loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader><CardTitle className="text-lg text-foreground">Quick Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <QuickLinkCard title="Manage Bookings" description="View and manage reservations" icon={Calendar} path="/admin/bookings" />
                <QuickLinkCard title="Room Availability" description="Block dates and set rules" icon={CalendarLock} path="/admin/room-availability" />
                <QuickLinkCard title="Room Allotments" description="Manage physical room stock" icon={ListOrdered} path="/admin/room-allotments" />
                <QuickLinkCard title="Guest Reviews" description="Moderate guest feedback" icon={Star} path="/admin/reviews" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="shadow-sm border-border h-full">
            <CardHeader><CardTitle className="text-lg text-foreground">Recent Bookings</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-6">
                {!loading && recentBookings.length === 0 && <p className="text-sm text-muted-foreground">No bookings yet.</p>}
                {recentBookings.map((booking) => (
                  <ActivityItem
                    key={booking.id}
                    title={`${booking.guest_name || 'Guest'} · ${booking.room_type || booking.accommodationType || 'Room'}`}
                    time={`${booking.check_in_date || ''} → ${booking.check_out_date || ''}`}
                  />
                ))}
              </div>
              <Button asChild variant="link" className="w-full mt-4 text-primary">
                <Link to="/admin/bookings">View All Bookings <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, loading }) {
  return (
    <Card className="shadow-sm"><CardContent className="p-6">
      <div className="flex items-center justify-between space-y-0 pb-2"><p className="text-sm font-medium text-muted-foreground">{title}</p><Icon className="h-4 w-4 text-muted-foreground" /></div>
      {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <div className="text-3xl font-bold font-serif text-foreground">{value}</div>}
      {loading ? <Skeleton className="h-3 w-32 mt-2" /> : <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </CardContent></Card>
  );
}

function QuickLinkCard({ title, description, icon: Icon, path }) {
  return (
    <Link to={path} className="group block"><div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" /></div>
      <div><h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3><p className="text-sm text-muted-foreground line-clamp-2">{description}</p></div>
    </div></Link>
  );
}

function ActivityItem({ title, time }) {
  return <div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full mt-2 bg-primary shrink-0" /><div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{time}</p></div></div>;
}
