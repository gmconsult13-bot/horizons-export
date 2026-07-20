import React from 'react';
import pb from '@/lib/pocketbaseClient.js';

export function DiningCard({ item }) {
  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border transition-all hover:-translate-y-1 hover:shadow-lg flex flex-col h-full">
      <div className="h-64 relative overflow-hidden">
        {item.image ? (
          <img 
            src={pb.files.getURL(item, item.image)} 
            alt={item.name} 
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">No Image</div>
        )}
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <span className="text-xs font-bold tracking-widest text-primary uppercase mb-2 block">{item.cuisine_type}</span>
        <h3 className="text-2xl font-serif font-bold mb-3">{item.name}</h3>
        <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-1">{item.description}</p>
        
        {item.amenities && (
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-foreground/70"><span className="font-semibold text-foreground">Features:</span> {item.amenities}</p>
          </div>
        )}
      </div>
    </div>
  );
}