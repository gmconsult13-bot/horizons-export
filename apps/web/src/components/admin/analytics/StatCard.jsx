import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils.js';

export function StatCard({ title, value, previousValue, subtitle, trend, format = 'number', colorStatus = 'neutral' }) {
  
  const getTrendIcon = () => {
    if (!trend) return <Minus className="w-4 h-4 text-muted-foreground" />;
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-analytics-good" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-analytics-poor" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getColorClass = () => {
    switch(colorStatus) {
      case 'good': return 'text-analytics-good';
      case 'warning': return 'text-analytics-warning';
      case 'poor': return 'text-analytics-poor';
      default: return 'text-foreground';
    }
  };

  const formattedValue = format === 'number' && typeof value === 'number' ? value.toLocaleString() : value;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold font-serif", getColorClass())}>
          {formattedValue}
        </div>
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center gap-2 mt-1">
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span className={cn("text-sm font-medium", trend > 0 ? "text-analytics-good" : trend < 0 ? "text-analytics-poor" : "text-muted-foreground")}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}