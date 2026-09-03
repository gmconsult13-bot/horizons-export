import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, TrendingUp, DollarSign, Percent, BedDouble, BarChart3 } from 'lucide-react';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function PMSAnalytics() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(new Date().toISOString().split('T')[0]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch(`/pms/analytics/overview?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch (e) { console.error('Analytics error:', e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAnalytics(); }, [from, to]);

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div className="text-sm text-muted-foreground">{label}</div>
      </div>
      <div className="text-3xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );

  const sources = data?.source_breakdown || {};
  const sourceEntries = Object.entries(sources).sort((a, b) => b[1].revenue - a[1].revenue);
  const maxRevenue = Math.max(...sourceEntries.map(s => s[1].revenue), 1);

  const sourceColors = {
    direct: 'bg-blue-500',
    'booking.com': 'bg-indigo-700',
    agoda: 'bg-amber-600',
    expedia: 'bg-purple-600',
    tripadvisor: 'bg-cyan-600',
    phone: 'bg-emerald-500',
    walk_in: 'bg-red-500',
    tour_operator: 'bg-pink-500',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet><title>Analytics | Raya Boutique PMS</title></Helmet>
      <Header />
      <main className="flex-grow py-6">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2"><BarChart3 className="w-7 h-7 text-primary" /> Analytics</h1>
              <p className="text-muted-foreground mt-1">Revenue, occupancy, and performance metrics</p>
            </div>
            <div className="flex gap-2 items-center">
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-md border border-border p-2 text-sm" />
              <span className="text-muted-foreground">—</span>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-md border border-border p-2 text-sm" />
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : data ? (
            <>
              {/* Key metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={DollarSign} label="Total Revenue" value={`€${(data.total_revenue || 0).toLocaleString('en', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`} sub={`${data.total_bookings || 0} bookings`} />
                <StatCard icon={TrendingUp} label="ADR" value={`€${(data.adr || 0).toFixed(2)}`} sub="Avg Daily Rate" />
                <StatCard icon={Percent} label="Occupancy" value={`${(data.occupancy_rate || 0).toFixed(1)}%`} sub={`${data.total_nights || 0} nights sold`} />
                <StatCard icon={BedDouble} label="RevPAR" value={`€${(data.revpar || 0).toFixed(2)}`} sub="Revenue / Available Room" />
              </div>

              {/* Source breakdown */}
              <div className="bg-card border border-border rounded-2xl p-6 mb-6">
                <h2 className="text-lg font-semibold mb-4">Revenue by Booking Source</h2>
                {sourceEntries.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No bookings in this period</p>
                ) : (
                  <div className="space-y-3">
                    {sourceEntries.map(([source, stats]) => (
                      <div key={source} className="flex items-center gap-4">
                        <div className="w-32 text-sm font-medium capitalize">{source.replace(/_/g, ' ')}</div>
                        <div className="flex-1 bg-muted rounded-full h-8 overflow-hidden">
                          <div
                            className={`h-full rounded-full flex items-center justify-end pr-3 text-xs text-white font-medium ${sourceColors[source] || 'bg-gray-500'}`}
                            style={{ width: `${Math.max(5, (stats.revenue / maxRevenue) * 100)}%` }}
                          >
                            €{stats.revenue.toLocaleString('en', { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                        <div className="w-20 text-sm text-right text-muted-foreground">{stats.count} bkg</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary table */}
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                  <tbody>
                    <tr className="border-b border-border"><td className="p-4 text-sm text-muted-foreground">Date Range</td><td className="p-4 text-sm font-medium text-right">{data.date_range?.from} — {data.date_range?.to}</td></tr>
                    <tr className="border-b border-border"><td className="p-4 text-sm text-muted-foreground">Total Bookings</td><td className="p-4 text-sm font-bold text-right">{data.total_bookings || 0}</td></tr>
                    <tr className="border-b border-border"><td className="p-4 text-sm text-muted-foreground">Nights Sold</td><td className="p-4 text-sm font-bold text-right">{data.total_nights || 0}</td></tr>
                    <tr className="border-b border-border"><td className="p-4 text-sm text-muted-foreground">Total Revenue</td><td className="p-4 text-sm font-bold text-right">€{(data.total_revenue || 0).toFixed(2)}</td></tr>
                    <tr><td className="p-4 text-sm text-muted-foreground">Average Daily Rate (ADR)</td><td className="p-4 text-sm font-bold text-right">€{(data.adr || 0).toFixed(2)}</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-20">Failed to load analytics. Make sure bookings exist for this period.</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
