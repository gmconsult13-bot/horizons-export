import React from 'react';
import { Calendar, Users, CreditCard, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/api/EcommerceApi.js';

export default function BookingCard({ booking, isUnfinished, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success/10 text-success hover:bg-success/20';
      case 'pending': return 'bg-warning/10 text-warning hover:bg-warning/20';
      case 'failed': return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
      default: return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <CardHeader className="bg-muted/30 pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-serif text-foreground">
            {booking.room_type || booking.accommodationType || 'Accommodation'}
          </CardTitle>
          <Badge variant="secondary" className={getStatusColor(booking.payment_status)}>
            {booking.payment_status || 'pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-3 text-primary" />
          <span>
            {new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}
          </span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="w-4 h-4 mr-3 text-primary" />
          <span>{booking.number_of_guests} Guest{booking.number_of_guests > 1 ? 's' : ''}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <CreditCard className="w-4 h-4 mr-3 text-primary" />
          <span className="font-medium text-foreground">
            {formatCurrency(Math.round((booking.final_price || 0) * 100), { code: 'USD', symbol: '$' })}
          </span>
        </div>
      </CardContent>
      {isUnfinished && (
        <CardFooter className="bg-muted/10 pt-4 border-t border-border/50 flex justify-end">
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => onDelete(booking.id)}
            className="transition-all duration-200 active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Cancel Booking
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}