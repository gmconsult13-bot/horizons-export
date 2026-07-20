import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export function ComparisonTable({ data, currentPeriodLabel, prevPeriodLabel }) {
  if (!data) return null;

  const getRowData = (key, label) => {
    const info = data[key] || { current: 0, prev: 0, change: 0, pct_change: 0 };
    return { label, ...info };
  };

  const rows = [
    getRowData('hotel', 'Hotel & Room'),
    getRowData('cleaning', 'Cleanliness'),
    getRowData('service', 'Service & Staff'),
    getRowData('food', 'Food & Dining'),
    getRowData('price_quality', 'Value for Money'),
  ];

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">Period Comparison</CardTitle>
        <CardDescription>Comparing {currentPeriodLabel} vs {prevPeriodLabel}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Current Avg</TableHead>
              <TableHead className="text-right">Previous Avg</TableHead>
              <TableHead className="text-right">Change</TableHead>
              <TableHead className="text-right">% Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right font-variant-numeric tabular-nums">{row.current.toFixed(2)}</TableCell>
                <TableCell className="text-right text-muted-foreground font-variant-numeric tabular-nums">{row.prev.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "inline-flex items-center justify-end font-medium tabular-nums",
                    row.change > 0 ? "text-analytics-good" : row.change < 0 ? "text-analytics-poor" : "text-muted-foreground"
                  )}>
                    {row.change > 0 ? '+' : ''}{row.change.toFixed(2)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className={cn(
                    "inline-flex items-center justify-end font-medium tabular-nums",
                    row.pct_change > 0 ? "text-analytics-good" : row.pct_change < 0 ? "text-analytics-poor" : "text-muted-foreground"
                  )}>
                    {row.pct_change > 0 && <TrendingUp className="w-3.5 h-3.5 mr-1" />}
                    {row.pct_change < 0 && <TrendingDown className="w-3.5 h-3.5 mr-1" />}
                    {row.pct_change === 0 && <Minus className="w-3.5 h-3.5 mr-1" />}
                    {Math.abs(row.pct_change).toFixed(1)}%
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}