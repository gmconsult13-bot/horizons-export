import React, { useState } from 'react';
import { saveRecord } from '@/utils/adminSaveUtils.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function DealForm({ deal, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: deal?.title || '',
    description: deal?.description || '',
    discount_percentage: deal?.discount_percentage || 0,
    start_date: deal?.start_date ? deal.start_date.split(' ')[0] : '',
    end_date: deal?.end_date ? deal.end_date.split(' ')[0] : '',
    is_active: deal?.is_active ?? true,
  });
  const [imageFile, setImageFile] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('discount_percentage', formData.discount_percentage);
      // Append time to ensure valid datetime format for PocketBase
      data.append('start_date', `${formData.start_date} 00:00:00.000Z`);
      data.append('end_date', `${formData.end_date} 23:59:59.999Z`);
      data.append('is_active', formData.is_active);

      if (imageFile) {
        data.append('image', imageFile);
      }

      const result = await saveRecord('guest_deals', data, deal?.id || null);
      if (!result.success) throw new Error(result.error);
      toast.success(deal?.id ? 'Deal updated successfully' : 'Deal created successfully');
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error saving deal:', error);
      toast.error(error.message || 'Failed to save deal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Deal Title <span className="text-destructive">*</span></Label>
        <Input 
          id="title" 
          name="title" 
          value={formData.title} 
          onChange={handleChange} 
          required 
          placeholder="e.g. Summer Special 20% Off" 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          value={formData.description} 
          onChange={handleChange} 
          placeholder="Describe the deal conditions and perks..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount_percentage">Discount Percentage (%) <span className="text-destructive">*</span></Label>
          <Input 
            id="discount_percentage" 
            name="discount_percentage" 
            type="number" 
            min="0" 
            max="100" 
            value={formData.discount_percentage} 
            onChange={handleChange} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="image">Deal Image</Label>
          <Input 
            id="image" 
            name="image" 
            type="file" 
            accept="image/*" 
            onChange={(e) => setImageFile(e.target.files[0])} 
          />
          {deal?.image && !imageFile && (
            <p className="text-xs text-muted-foreground mt-1">Current image will be kept if no new file is selected.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start_date">Start Date <span className="text-destructive">*</span></Label>
          <Input 
            id="start_date" 
            name="start_date" 
            type="date" 
            value={formData.start_date} 
            onChange={handleChange} 
            required 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="end_date">End Date <span className="text-destructive">*</span></Label>
          <Input 
            id="end_date" 
            name="end_date" 
            type="date" 
            value={formData.end_date} 
            onChange={handleChange} 
            required 
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-secondary/20 p-4 rounded-lg">
        <Switch 
          id="is_active" 
          checked={formData.is_active} 
          onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))} 
        />
        <Label htmlFor="is_active" className="font-medium cursor-pointer">Deal is currently active</Label>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : deal ? 'Update Deal' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}
