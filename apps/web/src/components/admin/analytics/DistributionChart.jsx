import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function DistributionChart({ data, title, description }) {
  if (!data) return null;

  // Convert map {1: x, 2: y...} to array suitable for recharts
  const chartData = [1, 2, 3, 4, 5, 6].map(rating => ({
    rating: `${rating} Star${rating > 1 ? 's' : ''}`,
    count: data[rating] || 0
  })).reverse(); // Recharts YAxis from top down looks better with highest rating at top

  const getColor = (ratingLabel) => {
    const num = parseInt(ratingLabel.split(' ')[0]);
    if (num >= 5) return 'hsl(var(--analytics-good))';
    if (num >= 3) return 'hsl(var(--analytics-warning))';
    return 'hsl(var(--analytics-poor))';
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border shadow-md p-3 rounded-lg">
          <p className="font-medium text-sm text-foreground">{payload[0].payload.rating}</p>
          <p className="text-muted-foreground text-sm">{payload[0].value} reviews</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="rating" 
                axisLine={false} 
                tickLine={false} 
                width={60}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
              />
              <RechartsTooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getColor(entry.rating)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}