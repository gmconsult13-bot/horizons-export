import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PriceForm({ isOpen, onClose, onSave, initialData, rooms, seasons }) {
  const [formData, setFormData] = useState({
    season: '',
    room_type: '',
    base_price: '',
    additional_guest_surcharge: '',
    child_surcharge: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        season: initialData.season || '',
        room_type: initialData.room_type || '',
        base_price: initialData.base_price || '',
        additional_guest_surcharge: initialData.additional_guest_surcharge || '',
        child_surcharge: initialData.child_surcharge || ''
      });
    } else {
      setFormData({
        season: '',
        room_type: '',
        base_price: '',
        additional_guest_surcharge: '',
        child_surcharge: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      season: formData.season,
      room_type: formData.room_type,
      base_price: Number(formData.base_price),
      additional_guest_surcharge: Number(formData.additional_guest_surcharge),
      child_surcharge: Number(formData.child_surcharge)
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Price Rule' : 'Add Price Rule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label>Season</Label>
            <Select 
              value={formData.season} 
              onValueChange={(v) => setFormData({...formData, season: v})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map(s => (
                  <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Room Type</Label>
            <Select 
              value={formData.room_type} 
              onValueChange={(v) => setFormData({...formData, room_type: v})}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map(r => (
                  <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Base Price (2 Guests) (€)</Label>
            <Input 
              type="number" 
              step="0.01"
              min="0"
              required
              value={formData.base_price}
              onChange={(e) => setFormData({...formData, base_price: e.target.value})}
              placeholder="e.g. 150.00"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Additional Guest (€)</Label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.additional_guest_surcharge}
                onChange={(e) => setFormData({...formData, additional_guest_surcharge: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Child Surcharge (€)</Label>
              <Input 
                type="number" 
                step="0.01"
                min="0"
                required
                value={formData.child_surcharge}
                onChange={(e) => setFormData({...formData, child_surcharge: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Pricing</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}