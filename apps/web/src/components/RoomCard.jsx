import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Leaf } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { formatCurrency } from '@/api/EcommerceApi.js';

const getRoomCapacityDescription = (name) => {
  const lowercaseName = name?.toLowerCase() || '';
  if (lowercaseName.includes('luxury suite')) return '4 adults + 2 children';
  if (lowercaseName.includes('double deluxe') || lowercaseName.includes('deluxe')) return '2 adults + 1 child';
  return '2 guests';
};

const getRoomThemeMapping = (name) => {
  const lowercaseName = name?.toLowerCase() || '';
  if (lowercaseName.includes('luxury suite')) {
    return {
      image: 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/8a6c4682de036e5bf720341a5ed179cd.jpg',
      description: 'Exclusive luxury suite featuring sweeping balcony access, modern minimalist design, abundant natural lighting, and premium botanical amenities.',
      amenities: ['Balcony Access', 'Natural Lighting', 'Modern Design', 'Botanical Decor']
    };
  } else if (lowercaseName.includes('apartment')) {
    return {
      image: 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/2d51d4c7a2d2d35c9f040b3ba60a768b.jpg',
      description: 'Premium spacious accommodation with contemporary luxury design, wooden accents, fern botanical bedding, gold and green abstract wall art, large windows with nature views, comfortable seating, smart TV, and full modern amenities including air conditioning.',
      amenities: ['Nature Views', 'Wooden Accents', 'Smart TV', 'Air Conditioning']
    };
  } else if (lowercaseName.includes('double deluxe') || lowercaseName.includes('deluxe')) {
    return {
      image: 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/4d63df05d70d30c1f8603d8d74d35da9.jpg',
      description: 'Spacious luxury bedroom with wooden headboard, fern botanical pattern bedding, contemporary wall art with gold and green tones, large architectural windows with nature views, beige armchair, smart TV, and modern amenities.',
      amenities: ['Large Windows', 'Wooden Headboard', 'Smart TV', 'Contemporary Art']
    };
  } else {
    // Economy Room Fallback
    return {
      image: 'https://horizons-cdn.hostinger.com/9719a614-3994-48cd-ad44-20d7d067e3db/2d51d4c7a2d2d35c9f040b3ba60a768b.jpg',
      description: 'Modern minimalist design with wooden accents, fern botanical pattern bedding, warm ambient lighting with black metal fixtures, large windows with views, comfortable seating area, and air conditioning.',
      amenities: ['Wooden Accents', 'Ambient Lighting', 'Seating Area', 'Air Conditioning']
    };
  }
};

const RoomCard = ({ room, onBookClick }) => {
  const theme = getRoomThemeMapping(room.name);
  
  const imageUrl = room.image 
    ? pb.files.getURL(room, room.image)
    : theme.image;

  const description = room.description || theme.description;
  
  const amenitiesList = room.amenities 
    ? room.amenities.split(',').map(a => a.trim()).filter(Boolean)
    : theme.amenities;

  return (
    <div className="group bg-card rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full border border-border/50 relative">
      {/* Decorative Botanical Corner Accent */}
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-secondary/10 to-transparent z-10 pointer-events-none rounded-tr-xl"></div>
      
      {/* Room Image */}
      <div className="relative h-72 overflow-hidden bg-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent z-10 opacity-70 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-50"></div>
        <img 
          src={imageUrl}
          alt={`Interior view of ${room.name} featuring botanical and minimalist design`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        {/* Updated Price Badge Overlay */}
        <div className="price-badge-overlay group-hover:scale-[1.02]">
          <span className="price-badge-amount">
            {formatCurrency(room.price * 100, { code: 'EUR', symbol: '€' })}
          </span> 
          <span className="price-badge-period">/ night</span>
        </div>
      </div>

      {/* Room Details */}
      <div className="p-8 flex flex-col flex-grow relative z-20 bg-card">
        <h3 className="text-2xl font-bold text-foreground mb-3 group-hover:text-secondary transition-colors" style={{ fontFamily: 'Playfair Display, serif', textWrap: 'balance' }}>
          {room.name}
        </h3>
        
        <p className="text-foreground/80 leading-relaxed mb-6 flex-grow text-sm">
          {description}
        </p>

        {/* Amenities */}
        {amenitiesList.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Leaf className="h-4 w-4 text-secondary" />
              <span className="text-sm font-medium tracking-wide uppercase text-secondary">Features</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map((amenity, index) => (
                <span 
                  key={index}
                  className="text-xs bg-secondary/5 text-secondary px-3 py-1.5 rounded-md font-medium border border-secondary/10"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Capacity */}
        <div className="flex items-center space-x-2 mb-8 text-sm font-medium text-foreground/70">
          <Users className="h-4 w-4 text-secondary/70" />
          <span>Accommodates {getRoomCapacityDescription(room.name)}</span>
        </div>

        {/* Book Button */}
        <Button 
          onClick={() => onBookClick?.(room)}
          className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold uppercase tracking-wider transition-all duration-300 hover:shadow-lg active:scale-[0.98] mt-auto h-12 rounded-lg"
        >
          Select Room
        </Button>
      </div>
    </div>
  );
};

export default RoomCard;
