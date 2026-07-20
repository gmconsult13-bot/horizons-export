import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { format, subDays, parseISO } from 'date-fns';
import { BarChart as ChartIcon, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import { FilterBar } from '@/components/admin/analytics/FilterBar.jsx';
import { StatCard } from '@/components/admin/analytics/StatCard.jsx';
import { TrendChart } from '@/components/admin/analytics/TrendChart.jsx';
import { DistributionChart } from '@/components/admin/analytics/DistributionChart.jsx';
import { ComparisonTable } from '@/components/admin/analytics/ComparisonTable.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

export default function ReviewsAnalyticsPage() {
  const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    roomType: 'all'
  });

  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState({
    summary: null,
    trends: null,
    distribution: null,
    comparison: null
  });

  const fetchAnalytics = async (currentFilters) => {
    setIsLoading(true);
    try {
      const { startDate, endDate, roomType } = currentFilters;
      
      // Calculate previous period dates for comparison
      const daysDiff = (parseISO(endDate).getTime() - parseISO(startDate).getTime()) / (1000 * 3600 * 24);
      const prevEnd = format(subDays(parseISO(startDate), 1), 'yyyy-MM-dd');
      const prevStart = format(subDays(parseISO(prevEnd), daysDiff), 'yyyy-MM-dd');

      const headers = { 'Authorization': `Bearer ${pb.authStore.token}` };
      const qParams = `start_date=${startDate}&end_date=${endDate}&room_type_id=${roomType}`;

      const [summaryRes, trendsRes, distRes, compRes] = await Promise.all([
        apiServerClient.fetch(`/reviews-analytics/summary?${qParams}`, { headers }),
        apiServerClient.fetch(`/reviews-analytics/trends?${qParams}`, { headers }),
        apiServerClient.fetch(`/reviews-analytics/distribution?${qParams}`, { headers }),
        apiServerClient.fetch(`/reviews-analytics/comparison?current_start=${startDate}&current_end=${endDate}&prev_start=${prevStart}&prev_end=${prevEnd}&room_type_id=${roomType}`, { headers })
      ]);

      const [summary, trends, dist, comp] = await Promise.all([
        summaryRes.ok ? summaryRes.json() : null,
        trendsRes.ok ? trendsRes.json() : null,
        distRes.ok ? distRes.json() : null,
        compRes.ok ? compRes.json() : null,
      ]);

      setData({
        summary,
        trends: trends?.trends,
        distribution: dist?.distribution,
        comparison: comp?.comparison,
        comparisonLabels: {
          current: `${format(parseISO(startDate), 'MMM d')} - ${format(parseISO(endDate), 'MMM d')}`,
          prev: `${format(parseISO(prevStart), 'MMM d')} - ${format(parseISO(prevEnd), 'MMM d')}`
        }
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics(filters);
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchAnalytics(newFilters);
  };

  const getCategoryName = (key) => {
    const map = {
      hotel: 'Hotel & Room',
      cleaning: 'Cleanliness',
      service: 'Service & Staff',
      food: 'Food & Dining',
      price_quality: 'Value for Money'
    };
    return map[key] || key;
  };

  const calculateOverallAverage = (averages) => {
    if (!averages) return 0;
    const sum = Object.values(averages).reduce((acc, curr) => acc + (curr.value || 0), 0);
    return (sum / 5).toFixed(2);
  };

  return (
    <div className="space-y-8 pb-12">
      <Helmet>
        <title>Reviews Analytics | Admin Portal</title>
      </Helmet>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">Reviews Analytics</h1>
          <p className="text-muted-foreground mt-1">Comprehensive insights into guest satisfaction and performance trends.</p>
        </div>
        <ChartIcon className="w-8 h-8 text-primary/40 hidden md:block" />
      </div>

      <FilterBar initialFilters={filters} onFilterChange={handleFilterChange} />

      {isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
            <Skeleton className="h-[120px] rounded-2xl" />
          </div>
          <Skeleton className="h-[400px] w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[300px] rounded-2xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Top Level KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="All-Time Reviews" 
              value={data.summary?.total_reviews || 0} 
              subtitle="Total verified reviews" 
            />
            <StatCard 
              title="Reviews This Month" 
              value={data.summary?.total_reviews_this_month || 0} 
            />
            <StatCard 
              title="Reviews This Year" 
              value={data.summary?.total_reviews_this_year || 0} 
            />
            <Card className="bg-primary text-primary-foreground shadow-sm">
              <CardContent className="p-6 flex flex-col justify-center h-full">
                <p className="text-primary-foreground/80 font-medium text-sm mb-2">Overall Average Score</p>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold font-serif">{calculateOverallAverage(data.summary?.averages)}</span>
                  <span className="text-lg text-primary-foreground/60 mb-1">/ 6.0</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Average Ratings by Category */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground">Category Performance</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {data.summary?.averages && Object.entries(data.summary.averages).map(([key, dataObj]) => (
                <Card key={key} className="shadow-sm border-t-4" style={{ borderTopColor: `hsl(var(--analytics-${dataObj.status}))` }}>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">{getCategoryName(key)}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-3xl font-bold tabular-nums text-analytics-${dataObj.status}`}>
                        {dataObj.value.toFixed(1)}
                      </span>
                      <Star className={`w-5 h-5 fill-current text-analytics-${dataObj.status}`} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <TrendChart data={data.trends} />
            </div>
            <div className="xl:col-span-1 flex flex-col justify-center">
              <ComparisonTable 
                data={data.comparison} 
                currentPeriodLabel={data.comparisonLabels?.current}
                prevPeriodLabel={data.comparisonLabels?.prev}
              />
            </div>
          </div>

          {/* Charts Row 2: Distributions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-foreground mt-4">Rating Distributions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DistributionChart data={data.distribution?.hotel} title="Hotel & Room" />
              <DistributionChart data={data.distribution?.cleaning} title="Cleanliness" />
              <DistributionChart data={data.distribution?.service} title="Service & Staff" />
              <DistributionChart data={data.distribution?.food} title="Food & Dining" />
              <DistributionChart data={data.distribution?.price_quality} title="Value for Money" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}