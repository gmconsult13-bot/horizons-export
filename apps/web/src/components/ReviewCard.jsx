import React from 'react';
import { Star } from 'lucide-react';
import { format } from 'date-fns';

export default function ReviewCard({ review }) {
  const {
    guest_name,
    hotel_rating,
    cleaning_rating,
    service_rating,
    food_rating,
    price_quality_rating,
    opinion,
    created_at
  } = review;

  // Calculate overall average for the main star display
  const averageRating = (
    (hotel_rating + cleaning_rating + service_rating + food_rating + price_quality_rating) / 5
  ).toFixed(1);

  return (
    <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif font-semibold text-lg text-card-foreground capitalize">{guest_name}</h3>
          <p className="text-sm text-muted-foreground">{format(new Date(created_at), 'MMMM d, yyyy')}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
          <Star className="w-4 h-4 star-filled" />
          <span className="font-semibold text-sm font-variant-numeric tabular-nums">{averageRating}</span>
          <span className="text-xs text-muted-foreground">/6</span>
        </div>
      </div>

      {opinion && (
        <blockquote className="text-card-foreground/80 mb-6 flex-grow italic font-serif leading-relaxed">
          "{opinion}"
        </blockquote>
      )}

      <div className="space-y-2 mt-auto pt-4 border-t border-border/50 text-sm">
        <RatingRow label="Hotel & Room" rating={hotel_rating} />
        <RatingRow label="Cleanliness" rating={cleaning_rating} />
        <RatingRow label="Service" rating={service_rating} />
        <RatingRow label="Food & Dining" rating={food_rating} />
        <RatingRow label="Value for Money" rating={price_quality_rating} />
      </div>
    </div>
  );
}

function RatingRow({ label, rating }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5, 6].map((star) => (
          <Star 
            key={star} 
            className={`w-3.5 h-3.5 ${star <= rating ? 'star-filled' : 'star-empty'}`} 
          />
        ))}
      </div>
    </div>
  );
}