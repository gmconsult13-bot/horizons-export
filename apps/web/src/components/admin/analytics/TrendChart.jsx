import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';

export function TrendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center border-dashed">
        <p className="text-muted-foreground">No trend data available for this period.</p>
      </Card>
    );
  }

  const formattedData = data.map(item => ({
    ...item,
    formattedDate: format(parseISO(item.date), 'MMM dd')
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border rounded-lg shadow-lg p-4">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground" style={{ color: entry.color }}>{entry.name}:</span>
              <span className="font-medium tabular-nums text-foreground">{entry.value.toFixed(1)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Rating Trends Over Time</CardTitle>
        <CardDescription>Daily average scores for the selected period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="formattedDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                domain={[0, 6]}
                ticks={[0, 1, 2, 3, 4, 5, 6]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px', fontSize: '13px' }} />
              <Line type="monotone" name="Hotel/Room" dataKey="hotel" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Cleaning" dataKey="cleaning" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Service" dataKey="service" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Food" dataKey="food" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" name="Value" dataKey="price_quality" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}