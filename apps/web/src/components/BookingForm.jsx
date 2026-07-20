import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useBooking } from '@/hooks/useBooking';
import { useRooms } from '@/hooks/useRooms';
import { toast } from 'sonner';
import { Loader2, Users, Info } from 'lucide-react';

const getRoomCapacityDescription = (name) => {
  const lowercaseName = name?.toLowerCase() || '';
  if (lowercaseName.includes('luxury suite')) return '4 adults + 2 children';
  if (lowercaseName.includes('double deluxe') || lowercaseName.includes('deluxe')) return '2 adults + 1 child';
  return '2 guests';
};

const MEAL_PLANS = {
  room_only: { label: 'Room Only', rate: 0, description: '+€0' },
  bed_breakfast: { label: 'Bed & Breakfast', rate: 10, description: '+€10/person/day' },
  half_board: { label: 'Half Board', rate: 35, description: '+€35/person/day' }
};

const BookingForm = ({ preSelectedRoom, onSuccess }) => {
  const { rooms, loading: roomsLoading } = useRooms();
  const { submitBooking, loading, error } = useBooking();

  const [formData, setFormData] = useState({
    guest_name: '',
    guest_email: '',
    check_in_date: '',
    check_out_date: '',
    room_type: preSelectedRoom || '',
    number_of_guests: 1,
    meal_plan: 'room_only',
    special_requests: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (preSelectedRoom) {
      setFormData(prev => ({ ...prev, room_type: preSelectedRoom }));
    }
  }, [preSelectedRoom]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.guest_name.trim()) {
      newErrors.guest_name = 'Name is required';
    }

    if (!formData.guest_email.trim()) {
      newErrors.guest_email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.guest_email)) {
      newErrors.guest_email = 'Invalid email format';
    }

    if (!formData.check_in_date) {
      newErrors.check_in_date = 'Check-in date is required';
    }

    if (!formData.check_out_date) {
      newErrors.check_out_date = 'Check-out date is required';
    }

    if (formData.check_in_date && formData.check_out_date) {
      if (new Date(formData.check_out_date) <= new Date(formData.check_in_date)) {
        newErrors.check_out_date = 'Check-out must be after check-in';
      }
    }

    if (!formData.room_type) {
      newErrors.room_type = 'Please select a room type';
    }

    if (formData.number_of_guests < 1 || formData.number_of_guests > 10) {
      newErrors.number_of_guests = 'Number of guests must be between 1 and 10';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculations
  const selectedRoom = rooms.find(r => r.name === formData.room_type);
  let nights = 0;
  if (formData.check_in_date && formData.check_out_date) {
    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    if (checkOut > checkIn) {
      nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    }
  }

  const isValidDates = nights > 0;
  const roomPricePerNight = selectedRoom?.price || 0;
  const baseRoomCost = roomPricePerNight * nights;
  
  const mealRate = MEAL_PLANS[formData.meal_plan]?.rate || 0;
  const validGuests = Math.max(1, formData.number_of_guests || 1);
  const mealPlanCost = mealRate * validGuests * nights;
  
  const totalPrice = baseRoomCost + mealPlanCost;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      const submissionData = {
        ...formData,
        meal_plan_cost: mealPlanCost
      };

      const booking = await submitBooking(submissionData);
      
      const planName = MEAL_PLANS[formData.meal_plan].label;
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-semibold">Booking Confirmed!</p>
          <p className="text-sm">Total: €{totalPrice} ({planName})</p>
        </div>
      );
      
      // Reset form
      setFormData({
        guest_name: '',
        guest_email: '',
        check_in_date: '',
        check_out_date: '',
        room_type: preSelectedRoom || '',
        number_of_guests: 1,
        meal_plan: 'room_only',
        special_requests: ''
      });
      setErrors({});

      if (onSuccess) {
        onSuccess(booking);
      }
    } catch (err) {
      toast.error(error || 'Failed to create booking');
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest Name */}
        <div>
          <Label htmlFor="guest_name" className="text-foreground/80 font-medium">Full Name</Label>
          <Input
            id="guest_name"
            type="text"
            value={formData.guest_name}
            onChange={(e) => handleChange('guest_name', e.target.value)}
            className="mt-2 focus-visible:ring-primary/50 text-foreground"
            placeholder="Enter your full name"
          />
          {errors.guest_name && (
            <p className="text-sm text-destructive mt-1.5">{errors.guest_name}</p>
          )}
        </div>

        {/* Guest Email */}
        <div>
          <Label htmlFor="guest_email" className="text-foreground/80 font-medium">Email Address</Label>
          <Input
            id="guest_email"
            type="email"
            value={formData.guest_email}
            onChange={(e) => handleChange('guest_email', e.target.value)}
            className="mt-2 focus-visible:ring-primary/50 text-foreground"
            placeholder="your.email@example.com"
          />
          {errors.guest_email && (
            <p className="text-sm text-destructive mt-1.5">{errors.guest_email}</p>
          )}
        </div>

        {/* Check-in Date */}
        <div>
          <Label htmlFor="check_in_date" className="text-foreground/80 font-medium">Check-in Date</Label>
          <Input
            id="check_in_date"
            type="date"
            value={formData.check_in_date}
            onChange={(e) => handleChange('check_in_date', e.target.value)}
            className="mt-2 focus-visible:ring-primary/50 text-foreground"
            min={new Date().toISOString().split('T')[0]}
          />
          {errors.check_in_date && (
            <p className="text-sm text-destructive mt-1.5">{errors.check_in_date}</p>
          )}
        </div>

        {/* Check-out Date */}
        <div>
          <Label htmlFor="check_out_date" className="text-foreground/80 font-medium">Check-out Date</Label>
          <Input
            id="check_out_date"
            type="date"
            value={formData.check_out_date}
            onChange={(e) => handleChange('check_out_date', e.target.value)}
            className="mt-2 focus-visible:ring-primary/50 text-foreground"
            min={formData.check_in_date || new Date().toISOString().split('T')[0]}
          />
          {errors.check_out_date && (
            <p className="text-sm text-destructive mt-1.5">{errors.check_out_date}</p>
          )}
        </div>

        {/* Room Type */}
        <div>
          <Label htmlFor="room_type" className="text-foreground/80 font-medium">Room Type</Label>
          <Select 
            value={formData.room_type} 
            onValueChange={(value) => handleChange('room_type', value)}
          >
            <SelectTrigger className="mt-2 focus-visible:ring-primary/50 text-foreground">
              <SelectValue placeholder="Select a room type" />
            </SelectTrigger>
            <SelectContent>
              {roomsLoading ? (
                <SelectItem value="loading" disabled>Loading rooms...</SelectItem>
              ) : (
                rooms.map((room) => (
                  <SelectItem key={room.id} value={room.name}>
                    {room.name} - €{room.price}/night
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {formData.room_type && (
            <p className="text-sm text-foreground/70 mt-2.5 flex items-center gap-1.5 bg-muted/50 p-2 rounded-md">
              <Users className="w-4 h-4 text-secondary" />
              <span>Capacity: {getRoomCapacityDescription(formData.room_type)}</span>
            </p>
          )}
          {errors.room_type && (
            <p className="text-sm text-destructive mt-1.5">{errors.room_type}</p>
          )}
        </div>

        {/* Number of Guests */}
        <div>
          <Label htmlFor="number_of_guests" className="text-foreground/80 font-medium">Number of Guests</Label>
          <Input
            id="number_of_guests"
            type="number"
            min="1"
            max="10"
            value={formData.number_of_guests}
            onChange={(e) => handleChange('number_of_guests', parseInt(e.target.value))}
            className="mt-2 focus-visible:ring-primary/50 text-foreground"
          />
          {errors.number_of_guests && (
            <p className="text-sm text-destructive mt-1.5">{errors.number_of_guests}</p>
          )}
        </div>
      </div>

      {/* Meal Plan */}
      <div className="pt-2">
        <Label className="text-foreground/80 font-medium mb-4 block">Select Meal Plan</Label>
        <RadioGroup 
          value={formData.meal_plan} 
          onValueChange={(value) => handleChange('meal_plan', value)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {Object.entries(MEAL_PLANS).map(([key, plan]) => (
            <Label 
              key={key}
              htmlFor={key} 
              className={`flex items-start space-x-3 border rounded-xl p-4 cursor-pointer transition-all duration-200 
                ${formData.meal_plan === key 
                  ? 'border-secondary bg-secondary/5 ring-1 ring-secondary' 
                  : 'border-border/50 hover:bg-muted/50'
                }`}
            >
              <RadioGroupItem value={key} id={key} className="mt-1" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{plan.label}</span>
                <span className="text-sm text-foreground/60 mt-1">{plan.description}</span>
              </div>
            </Label>
          ))}
        </RadioGroup>
      </div>

      {/* Special Requests */}
      <div>
        <Label htmlFor="special_requests" className="text-foreground/80 font-medium">Special Requests (Optional)</Label>
        <Textarea
          id="special_requests"
          value={formData.special_requests}
          onChange={(e) => handleChange('special_requests', e.target.value)}
          className="mt-2 focus-visible:ring-primary/50 resize-none text-foreground"
          placeholder="Any special requirements or preferences..."
          rows={3}
        />
      </div>

      {/* Price Summary */}
      {selectedRoom && isValidDates ? (
        <div className="bg-muted p-6 rounded-xl border border-border/50">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Info className="w-4 h-4 text-secondary" /> Price Breakdown
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-foreground/80">
              <span>{selectedRoom.name} ({nights} {nights === 1 ? 'night' : 'nights'})</span>
              <span className="font-medium">€{baseRoomCost}</span>
            </div>
            {mealPlanCost > 0 && (
              <div className="flex justify-between items-center text-foreground/80">
                <span>{MEAL_PLANS[formData.meal_plan].label} ({validGuests} {validGuests === 1 ? 'guest' : 'guests'})</span>
                <span className="font-medium">€{mealPlanCost}</span>
              </div>
            )}
            <div className="pt-4 mt-2 border-t border-border flex justify-between items-center font-bold text-lg text-foreground">
              <span>Total Amount</span>
              <span className="text-secondary">€{totalPrice}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-muted/50 p-6 rounded-xl border border-border/50 text-center text-sm text-foreground/60">
          Select dates and room type to see the total price
        </div>
      )}

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wider transition-all duration-300 hover:shadow-warm-glow active:scale-[0.98] h-14 text-base"
        disabled={loading || !isValidDates || !selectedRoom}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing Booking...
          </>
        ) : (
          'Confirm Booking'
        )}
      </Button>
    </form>
  );
};

export default BookingForm;