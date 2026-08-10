import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Calendar,
  Star,
  TrendingUp,
  ArrowRight,
  AlarmClock as CalendarLock,
  ListOrdered,
  LogOut,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { useAdminAuth } from '@/contexts/AdminAuthContext.jsx';
import pb from '@/lib/pocketbaseClient.js';

const EMPTY_STATS = {
  revenue: 0,
  occupancy: 0,
  bookingsThisMonth: 0,
  reviewsThisMonth: 0,
};

function toPocketBaseDate(date) {
  return date.toISOString().replace('T', ' ');
}

function getMonthRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { start, end };
}

function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return '';
  const timestamp = new Date(dateValue).getTime();
  if (Number.isNaN(timestamp)) return '';

  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  return new Date(timestamp).toLocaleDateString();
}

export default function AdminDashboard() {
  const { currentUser, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(EMPTY_STATS);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchDashboardStats = async () => {
      setLoading(true);
      setLoadError('');

      try {
        const now = new Date();
        const { start, end } = getMonthRange(now);
        const monthStart = toPocketBaseDate(start);
        const nextMonthStart = toPocketBaseDate(end);
        const today = now.toISOString().slice(0, 10);

        const results = await Promise.allSettled([
          pb.collection('bookings').getFullList({
            filter: `created >= "${monthStart}" && created < "${nextMonthStart}"`,
            sort: '-created',
            $autoCancel: false,
          }),
          pb.collection('bookings').getFullList({
            filter: `check_in_date <= "${today} 23:59:59.999Z" && check_out_date > "${today} 00:00:00.000Z" && payment_status != "failed"`,
            $autoCancel: false,
          }),
          pb.collection('rooms').getFullList({
            $autoCancel: false,
          }),
          pb.collection('guest_reviews').getFullList({
            filter: `created >= "${monthStart}" && created < "${nextMonthStart}"`,
            sort: '-created',
            $autoCancel: false,
          }),
          pb.collection('bookings').getList(1, 4, {
            sort: '-created',
            $autoCancel: false,
          }),
          pb.collection('guest_reviews').getList(1, 4, {
            sort: '-created',
            $autoCancel: false,
          }),
        ]);

        const failures = results.filter((result) => result.status === 'rejected');
        failures.forEach((failure) => {
          console.error('Dashboard data source failed:', failure.reason);
        });

        const valueOr = (index, fallback) =>
          results[index].status === 'fulfilled' ? results[index].value : fallback;

        const monthlyBookings = valueOr(0, []);
        const activeBookings = valueOr(1, []);
        const rooms = valueOr(2, []);
        const monthlyReviews = valueOr(3, []);
        const latestBookings = valueOr(4, { items: [] });
        const latestReviews = valueOr(5, { items: [] });

        const validMonthlyBookings = monthlyBookings.filter(
          (booking) => booking.payment_status !== 'failed'
        );
        const completedBookings = validMonthlyBookings.filter(
          (booking) => booking.payment_status === 'completed'
        );
        const revenue = completedBookings.reduce(
          (total, booking) => total + (Number(booking.final_price) || 0),
          0
        );

        const totalRoomInventory = rooms.reduce(
          (total, room) => total + (Number(room.total_rooms) || 0),
          0
        );
        const occupiedRooms = activeBookings.length;
        const occupancy = totalRoomInventory > 0
          ? Math.min(100, (occupiedRooms / totalRoomInventory) * 100)
          : 0;

        const activities = [
          ...latestBookings.items.map((booking) => ({
            id: `booking-${booking.id}`,
            title: `Booking ${booking.guest_name || booking.id}`,
            time: formatRelativeTime(booking.created),
            created: booking.created,
          })),
          ...latestReviews.items.map((review) => ({
            id: `review-${review.id}`,
            title: `New ${review.rating ? `${review.rating}-star ` : ''}review`,
            time: formatRelativeTime(review.created),
            created: review.created,
          })),
        ]
          .sort((a, b) => new Date(b.created) - new Date(a.created))
          .slice(0, 4);

        if (!cancelled) {
          setStats({
            revenue,
            occupancy: Number(occupancy.toFixed(1)),
            bookingsThisMonth: validMonthlyBookings.length,
            reviewsThisMonth: monthlyReviews.length,
          });
          setRecentActivity(activities);
          if (failures.length === results.length) {
            setLoadError('Dashboard data is temporarily unavailable.');
          }
        }
      } catch (error) {
        console.error('Failed to load live dashboard statistics:', error);
        if (!cancelled) {
          setStats(EMPTY_STATS);
          setRecentActivity([]);
          setLoadError('Some dashboard figures could not be loaded from the database.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchDashboardStats();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const greeting = useMemo(() => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) return 'Good morning';
    if (currentHour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <AdminLayout>
      <Helmet>
        <title>Dashboard | Admin Portal</title>
      </Helmet>

      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">
            {greeting}, {currentUser?.name?.split(' ')[0] || 'Administrator'}
          </h1>
          <p className="text-muted-foreground mt-1">Live figures from the hotel database.</p>
          {loadError && <p className="text-sm text-destructive mt-2">{loadError}</p>}
        </div>
        <Button variant="outline" onClick={handleLogout} className="shrink-0 bg-background hover:bg-muted">
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <MetricCard
          title="Revenue (Month)"
          value={formatCurrency(stats.revenue)}
          subtitle="Completed payments this month"
          icon={CreditCard}
          loading={loading}
        />
        <MetricCard
          title="Occupancy Today"
          value={`${stats.occupancy}%`}
          subtitle="Occupied rooms / total inventory"
          icon={TrendingUp}
          loading={loading}
        />
        <MetricCard
          title="New Bookings"
          value={stats.bookingsThisMonth}
          subtitle="Created this month"
          icon={Calendar}
          loading={loading}
        />
        <MetricCard
          title="New Reviews"
          value={stats.reviewsThisMonth}
          subtitle="Created this month"
          icon={Star}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm border-border">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Quick Actions</CardTitle>
            </CardHeader>
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
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-5">
                  {[0, 1, 2, 3].map((item) => <Skeleton key={item} className="h-10 w-full" />)}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-6">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} title={activity.title} time={activity.time} />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No recent booking or review activity.</p>
              )}
              <Button asChild variant="link" className="w-full mt-4 text-primary">
                <Link to="/admin/bookings">
                  View All Bookings <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
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
    <Card className="shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        {loading ? <Skeleton className="h-8 w-24 mt-1" /> : <div className="text-3xl font-bold font-serif text-foreground">{value}</div>}
        {loading ? <Skeleton className="h-3 w-32 mt-2" /> : <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function QuickLinkCard({ title, description, icon: Icon, path }) {
  return (
    <Link to={path} className="group block">
      <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function ActivityItem({ title, time }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 rounded-full mt-2 bg-primary shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
