import React, { useState } from 'react';
import { Calendar as CalendarIcon, Filter, RotateCcw } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function FilterBar({ onFilterChange, initialFilters }) {
  const [filters, setFilters] = useState(initialFilters);

  const handleApply = () => {
    onFilterChange(filters);
  };

  const handleReset = () => {
    const defaults = {
      startDate: format(subDays(new Date(), 90), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      roomType: 'all'
    };
    setFilters(defaults);
    onFilterChange(defaults);
  };

  return (
    <div className="bg-card border rounded-2xl p-4 flex flex-col md:flex-row items-end md:items-end gap-4 shadow-sm">
      <div className="w-full md:w-auto space-y-1.5 flex-1">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Date Range</Label>
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="w-full md:w-40 bg-background"
          />
          <span className="text-muted-foreground">to</span>
          <Input 
            type="date" 
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            className="w-full md:w-40 bg-background"
          />
        </div>
      </div>
      
      <div className="flex w-full md:w-auto gap-2">
        <Button onClick={handleReset} variant="outline" className="w-full md:w-auto">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset
        </Button>
        <Button onClick={handleApply} className="w-full md:w-auto bg-primary text-primary-foreground">
          <Filter className="w-4 h-4 mr-2" /> Apply Filters
        </Button>
      </div>
    </div>
  );
}