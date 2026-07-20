import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import apiServerClient from '@/lib/apiServerClient.js';

const DAYS_OF_WEEK = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 0, label: 'Sunday' },
];

export function AddRecurringClosureForm({ roomTypeId, onRuleAdded }) {
  const [selectedDays, setSelectedDays] = useState([]);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleDay = (val) => {
    setSelectedDays(prev => 
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) return toast.error('Please select at least one day');
    if (!reason.trim()) return toast.error('Please provide a reason');

    setIsSubmitting(true);
    try {
      // Create a rule for each selected day
      await Promise.all(selectedDays.map(day => 
        apiServerClient.fetch(`/room-availability/${roomTypeId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rule_type: 'closed_day_of_week',
            day_of_week: day,
            reason: reason.trim()
          })
        }).then(async res => {
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Failed to add recurring rule');
          }
        })
      ));

      toast.success('Recurring closure rules added');
      setSelectedDays([]);
      setReason('');
      onRuleAdded();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-3">
        <Label>Days of the Week</Label>
        <div className="grid grid-cols-2 gap-2">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox 
                id={`day-${day.value}`}
                checked={selectedDays.includes(day.value)}
                onCheckedChange={() => toggleDay(day.value)}
              />
              <label 
                htmlFor={`day-${day.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {day.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Input 
          placeholder="e.g., Weekly Deep Cleaning" 
          value={reason} 
          onChange={(e) => setReason(e.target.value)} 
          required 
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Add Recurring Closures
      </Button>
    </form>
  );
}