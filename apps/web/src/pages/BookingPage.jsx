import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AlertCircle, Loader2, CalendarPlus as CalendarIcon } from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import { calculateNightlyPrice, calculateTotalPrice, getSeasonMultiplier } from '@/lib/PriceCalculator.js';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { cn } from '@/lib/utils';

export default function BookingPage() {
  const navigate = useNavigate();
  const today = new Date();

  const [rooms, setRooms] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [blockedDates, setBlockedDates] = useState([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const [formData, setFormData] = useState({
    accommodationType: '',
    dateRange: { from: undefined, to: undefined },
    numberOfAdults: 2,
    numberOfChildren: 0,
    childrenAges: []
  });

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const records = await pb.collection('rooms').getFullList({
          sort: 'name',
          $autoCancel: false
        });
        setRooms(records);
        if (records.length > 0) {
          setFormData(prev => ({ ...prev, accommodationType: records[0].name }));
        }
      } catch (error) {
        console.error('Failed to fetch rooms:', error);
        toast.error('Failed to load available rooms.');
      } finally {
        setIsLoadingRooms(false);
      }
    };

    fetchRooms();
  }, []);

  const selectedRoom = rooms.find(r => r.name === formData.accommodationType);

  useEffect(() => {
    const fetchBlockedDates = async () => {
      if (!selectedRoom?.id) return;
      try {
        const startStr = format(today, 'yyyy-MM-dd');
        const endStr = format(addDays(today, 365), 'yyyy-MM-dd');
        const res = await apiServerClient.fetch(`/room-availability/${selectedRoom.id}/check-availability?start_date=${startStr}&end_date=${endStr}`);
        const data = await res.json();
        if (data.blocked_dates) {
          setBlockedDates(data.blocked_dates.map(dStr => new Date(dStr)));
        } else {
          setBlockedDates([]);
        }
      } catch (err) {
        console.error("Failed to fetch blocked dates:", err);
      }
    };
    fetchBlockedDates();
  }, [selectedRoom?.id]);

  const handleChildCountChange = (count) => {
    const newCount = Math.max(0, parseInt(count) || 0);
    const newAges = [...formData.childrenAges];
    
    if (newCount > newAges.length) {
      for (let i = newAges.length; i < newCount; i++) newAges.push(0);
    } else if (newCount < newAges.length) {
      newAges.length = newCount;
    }
    
    setFormData({ ...formData, numberOfChildren: newCount, childrenAges: newAges });
  };

  const handleChildAgeChange = (index, age) => {
    const newAges = [...formData.childrenAges];
    newAges[index] = parseInt(age) || 0;
    setFormData({ ...formData, childrenAges: newAges });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.dateRange.from || !formData.dateRange.to) {
      toast.error('Please select check-in and check-out dates');
      return;
    }

    if (selectedRoom && selectedRoom.available_rooms <= 0) {
      toast.error('Sorry, there are no rooms available for this type.');
      return;
    }

    const checkInStr = format(formData.dateRange.from, 'yyyy-MM-dd');
    const checkOutStr = format(formData.dateRange.to, 'yyyy-MM-dd');

    setIsCheckingAvailability(true);
    try {
      const res = await apiServerClient.fetch(`/room-availability/${selectedRoom.id}/check-availability?start_date=${checkInStr}&end_date=${checkOutStr}`);
      const checkData = await res.json();

      if (!checkData.available) {
        toast.error(`Dates unavailable: ${checkData.reason}`);
        return;
      }
    } catch (err) {
      console.error("Availability check error:", err);
      toast.error("Failed to verify availability. Please try again.");
      return;
    } finally {
      setIsCheckingAvailability(false);
    }

    const nights = differenceInDays(formData.dateRange.to, formData.dateRange.from);

    if (nights <= 0) {
      toast.error('Check-out date must be after check-in date');
      return;
    }

    const seasonMultiplier = getSeasonMultiplier(checkInStr, checkOutStr, []);
    const nightlyCosts = calculateNightlyPrice(
      formData.accommodationType, 
      seasonMultiplier, 
      formData.numberOfAdults, 
      formData.numberOfChildren, 
      formData.childrenAges
    );

    const totalPrice = calculateTotalPrice(nightlyCosts.totalNightly, nights);

    navigate('/booking/review', {
      state: {
        bookingData: {
          ...formData,
          checkInDate: checkInStr,
          checkOutDate: checkOutStr,
          roomId: selectedRoom?.id,
          available_rooms: selectedRoom?.available_rooms
        },
        priceData: {
          ...nightlyCosts,
          seasonMultiplier,
          nights,
          totalPrice
        }
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Book Your Stay | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-10 text-foreground text-center font-serif">Book Your Stay</h1>

          <form onSubmit={handleSubmit} className="bg-card p-8 rounded-2xl shadow-sm border border-border space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-foreground">Accommodation Type</Label>
                {isLoadingRooms ? (
                  <div className="h-10 mt-2 flex items-center text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading rooms...
                  </div>
                ) : (
                  <Select 
                    value={formData.accommodationType} 
                    onValueChange={(v) => {
                      setFormData({...formData, accommodationType: v, dateRange: { from: undefined, to: undefined }})
                    }}
                  >
                    <SelectTrigger className="mt-2 text-foreground bg-background">
                      <SelectValue placeholder="Select a room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.name}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {selectedRoom && selectedRoom.available_rooms > 0 && selectedRoom.available_rooms < 3 && (
                  <div className="mt-3 p-3 bg-warning/10 text-warning-foreground rounded-md text-sm flex items-center border border-warning/20">
                    <AlertCircle className="w-4 h-4 mr-2 text-warning" />
                    Only {selectedRoom.available_rooms} room{selectedRoom.available_rooms > 1 ? 's' : ''} left!
                  </div>
                )}
                
                {selectedRoom && selectedRoom.available_rooms <= 0 && (
                  <div className="mt-3 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center border border-destructive/20">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Sold out. Please select another room type.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-foreground">Stay Dates</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal text-base",
                        !formData.dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 opacity-70" />
                      {formData.dateRange.from ? (
                        formData.dateRange.to ? (
                          <>
                            {format(formData.dateRange.from, "LLL dd, y")} - {format(formData.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(formData.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Select check-in and check-out dates</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={formData.dateRange.from || today}
                      selected={formData.dateRange}
                      onSelect={(range) => setFormData({...formData, dateRange: range || {from: undefined, to: undefined}})}
                      numberOfMonths={2}
                      disabled={[{ before: today }, ...blockedDates]}
                      modifiers={{ blocked: blockedDates }}
                      modifiersClassNames={{ blocked: "bg-destructive/20 text-destructive line-through" }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-foreground">Adults</Label>
                <Input 
                  type="number" 
                  min={1} 
                  max={6}
                  value={formData.numberOfAdults}
                  onChange={(e) => setFormData({...formData, numberOfAdults: parseInt(e.target.value) || 1})}
                  className="mt-2 text-foreground bg-background"
                />
              </div>
              <div>
                <Label className="text-foreground">Children</Label>
                <Input 
                  type="number" 
                  min={0} 
                  max={4}
                  value={formData.numberOfChildren}
                  onChange={(e) => handleChildCountChange(e.target.value)}
                  className="mt-2 text-foreground bg-background"
                />
              </div>
            </div>

            {formData.numberOfChildren > 0 && (
              <div className="p-5 bg-muted/30 rounded-xl space-y-4 border border-border/50">
                <Label className="font-semibold text-foreground">Children Ages</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.childrenAges.map((age, idx) => (
                    <div key={idx}>
                      <Label className="text-xs text-foreground">Child {idx + 1} Age</Label>
                      <Input 
                        type="number" 
                        min={0} 
                        max={17}
                        value={age}
                        onChange={(e) => handleChildAgeChange(idx, e.target.value)}
                        className="mt-1 text-foreground bg-background"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-12 text-lg transition-all duration-200 active:scale-[0.98]"
              disabled={isLoadingRooms || isCheckingAvailability || (selectedRoom && selectedRoom.available_rooms <= 0)}
            >
              {isCheckingAvailability ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              Review Booking
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}