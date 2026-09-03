import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

export default function PMSCalendar() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    return monday;
  });
  const [viewDays] = useState(14); // 2-week view
  const [dragState, setDragState] = useState(null);
  const calendarRef = useRef(null);

  const fromDate = selectedDate.toISOString().split('T')[0];
  const toDate = new Date(selectedDate);
  toDate.setDate(toDate.getDate() + viewDays - 1);
  const toDateStr = toDate.toISOString().split('T')[0];

  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch(
        `/pms/calendar?from=${fromDate}&to=${toDateStr}`
      );
      if (!res.ok) throw new Error('Failed to load calendar');
      const data = await res.json();
      setRooms(data.rooms || []);
      setBookings(data.bookings || []);
    } catch (error) {
      console.error('Calendar fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDateStr]);

  useEffect(() => {
    fetchCalendarData();
  }, [fetchCalendarData]);

  const getDaysArray = () => {
    const days = [];
    for (let i = 0; i < viewDays; i++) {
      const d = new Date(selectedDate);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const days = getDaysArray();

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Get bookings for a specific room and day
  const getBookingForCell = (roomId, dayIndex) => {
    const dayDate = days[dayIndex];
    const dayStr = dayDate.toISOString().split('T')[0];

    return bookings.filter(b => {
      const checkIn = new Date(b.check_in);
      const checkOut = new Date(b.check_out);
      const dayStart = new Date(dayDate);
      dayStart.setHours(0, 0, 0, 0);

      const assignedRoom = b.assigned_room === roomId;
      const roomTypeMatches = !b.assigned_room && rooms.find(r => r.id === roomId)?.room_type === b.room_type;

      return (assignedRoom || roomTypeMatches) && dayStart >= checkIn && dayStart < checkOut;
    });
  };

  // Render a booking bar
  const renderBookingBar = (booking, dayIndex) => {
    const checkIn = new Date(booking.check_in);
    const checkOut = new Date(booking.check_out);
    const startDay = new Date(selectedDate);
    const endDay = new Date(selectedDate);
    endDay.setDate(endDay.getDate() + viewDays - 1);

    // Calculate position
    const bookingStart = checkIn < startDay ? startDay : checkIn;
    const bookingEnd = checkOut > endDay ? endDay : checkOut;

    const startOffset = Math.floor((bookingStart - startDay) / (1000 * 60 * 60 * 24));
    const duration = Math.max(1, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));

    if (startOffset + duration <= dayIndex || startOffset > dayIndex) return null;

    // Only render on the first day of the booking within our view
    if (dayIndex !== Math.max(0, startOffset)) return null;

    const widthPercent = (duration / viewDays) * 100;
    const leftPercent = (startOffset / viewDays) * 100;

    return (
      <div
        key={booking.id}
        className="absolute top-1 h-10 rounded-lg flex items-center px-2 text-xs text-white font-medium cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap z-10"
        style={{
          backgroundColor: booking.color || '#3b82f6',
          width: `calc(${widthPercent}% - 4px)`,
          left: `calc(${leftPercent}% + 2px)`,
        }}
        title={`${booking.guest_name} — ${booking.check_in} to ${booking.check_out}`}
      >
        {booking.guest_name}
      </div>
    );
  };

  const navigateWeek = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + direction * 7);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    today.setDate(today.getDate() - today.getDay() + 1);
    setSelectedDate(today);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>PMS Calendar | Raya Boutique Admin</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="w-7 h-7 text-primary" />
                PMS Calendar
              </h1>
              <p className="text-muted-foreground mt-1">
                Drag booking edges to extend or shorten stays. Click empty cells to create bookings.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(-1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium px-2">
                {fromDate} — {toDateStr}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateWeek(1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={fetchCalendarData}>
                Refresh
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4 text-xs">
            {[
              { label: 'Direct', color: '#3b82f6' },
              { label: 'Booking.com', color: '#1e40af' },
              { label: 'Agoda', color: '#b45309' },
              { label: 'Expedia', color: '#7c3aed' },
              { label: 'Walk-in', color: '#dc2626' },
              { label: 'Phone', color: '#16a34a' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto border border-border rounded-lg bg-card">
              <div className="min-w-[1200px]">
                {/* Date header row */}
                <div className="grid border-b border-border" style={{ gridTemplateColumns: `120px repeat(${viewDays}, 1fr)` }}>
                  <div className="p-2 text-xs font-semibold text-muted-foreground border-r border-border">
                    Room
                  </div>
                  {days.map((day, i) => (
                    <div
                      key={i}
                      className={`p-2 text-center text-xs font-medium border-r border-border ${isToday(day) ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}
                    >
                      <div>{day.toLocaleDateString('en', { weekday: 'short' })}</div>
                      <div className="text-sm font-bold mt-0.5">{day.getDate()}</div>
                    </div>
                  ))}
                </div>

                {/* Room rows */}
                {rooms.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    No rooms configured. Add rooms in Room Management first.
                  </div>
                ) : (
                  rooms.map((room) => (
                    <div
                      key={room.id}
                      className="grid border-b border-border hover:bg-muted/20 transition-colors relative"
                      style={{ gridTemplateColumns: `120px repeat(${viewDays}, 1fr)` }}
                    >
                      <div className="p-2 text-sm font-medium border-r border-border flex items-center gap-1">
                        {room.room_number}
                        {room.status !== 'active' && (
                          <span className="text-xs text-destructive">⚠</span>
                        )}
                      </div>
                      {days.map((day, dayIndex) => (
                        <div
                          key={dayIndex}
                          className={`border-r border-border min-h-[44px] relative cursor-pointer hover:bg-primary/5 ${isToday(day) ? 'bg-primary/5' : ''}`}
                        >
                          {renderBookingBarForRoom(room, dayIndex, days, bookings, selectedDate, viewDays)}
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

// Helper function rendered outside component scope issue — inline version
function renderBookingBarForRoom(room, dayIndex, days, bookings, startDate, viewDays) {
  const dayDate = days[dayIndex];
  const dayStr = dayDate.toISOString().split('T')[0];

  const cellBookings = bookings.filter(b => {
    const checkIn = new Date(b.check_in);
    const checkOut = new Date(b.check_out);
    const dayStart = new Date(dayDate);
    dayStart.setHours(0, 0, 0, 0);
    const matches = b.assigned_room === room.id;
    return matches && dayStart >= checkIn && dayStart < checkOut;
  });

  if (cellBookings.length === 0) return null;

  const booking = cellBookings[0];
  const checkIn = new Date(booking.check_in);
  const checkOut = new Date(booking.check_out);
  const startDay = new Date(startDate);
  const endDay = new Date(startDate);
  endDay.setDate(endDay.getDate() + viewDays - 1);

  const bookingStart = checkIn < startDay ? startDay : checkIn;
  const bookingEnd = checkOut > endDay ? endDay : checkOut;

  const startOffset = Math.floor((bookingStart - startDay) / (1000 * 60 * 60 * 24));
  const duration = Math.max(1, Math.ceil((bookingEnd - bookingStart) / (1000 * 60 * 60 * 24)));

  if (dayIndex !== Math.max(0, startOffset)) return null;

  // Adjust width for view boundary
  const visibleDuration = Math.min(duration, viewDays - startOffset);
  const widthPercent = (visibleDuration / viewDays) * 100;
  const leftPercent = 0; // positioned by grid cell

  return (
    <div
      className="absolute top-1 bottom-1 rounded-lg flex items-center px-2 text-xs text-white font-medium cursor-pointer hover:opacity-80 transition-opacity overflow-hidden whitespace-nowrap"
      style={{
        backgroundColor: booking.color || '#3b82f6',
        width: `${widthPercent * 14.28}%`,
        maxWidth: `${visibleDuration * 100 - 4}%`,
      }}
      title={`${booking.guest_name} — ${booking.check_in} to ${booking.check_out} — €${(booking.final_price || 0).toFixed(2)}`}
      onClick={(e) => {
        e.stopPropagation();
        // Future: open booking detail panel
        console.log('Booking clicked:', booking.id);
      }}
    >
      {booking.guest_name}
    </div>
  );
}
