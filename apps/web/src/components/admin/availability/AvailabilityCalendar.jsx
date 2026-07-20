import React, { useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { isWithinInterval, parseISO, getDay, isSameDay } from 'date-fns';

export function AvailabilityCalendar({ rules }) {
  // Compute modifier dates based on active rules
  const { closedDates, recurringDates } = useMemo(() => {
    const closed = [];
    const recurring = [];

    const activeRules = (rules || []).filter(r => r.is_active);

    activeRules.forEach(rule => {
      if (rule.rule_type === 'closed_date') {
        closed.push(parseISO(rule.start_date.split(' ')[0]));
      }
    });

    return { closedDates: closed, recurringDates: recurring };
  }, [rules]);

  const modifiers = {
    closed: (date) => {
      const activeRules = (rules || []).filter(r => r.is_active);
      return activeRules.some(rule => {
        if (rule.rule_type === 'closed_date') {
          return isSameDay(date, parseISO(rule.start_date.split(' ')[0]));
        }
        if (rule.rule_type === 'closed_range') {
          return isWithinInterval(date, {
            start: parseISO(rule.start_date.split(' ')[0]),
            end: parseISO(rule.end_date.split(' ')[0])
          });
        }
        return false;
      });
    },
    recurring: (date) => {
      const activeRules = (rules || []).filter(r => r.is_active);
      return activeRules.some(rule => {
        if (rule.rule_type === 'closed_day_of_week') {
          return getDay(date) === rule.day_of_week;
        }
        return false;
      });
    }
  };

  const modifiersClassNames = {
    closed: "bg-[hsl(var(--calendar-closed))] text-white hover:bg-[hsl(var(--calendar-closed))] hover:text-white font-bold rounded-md",
    recurring: "bg-[hsl(var(--calendar-recurring))] text-white hover:bg-[hsl(var(--calendar-recurring))] hover:text-white font-bold rounded-md"
  };

  return (
    <div className="bg-card border rounded-xl p-4 flex justify-center shadow-sm">
      <Calendar
        mode="multiple"
        numberOfMonths={3}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        className="w-full"
        disabled={[{ before: new Date() }]}
      />
    </div>
  );
}