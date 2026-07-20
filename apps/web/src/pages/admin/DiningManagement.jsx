import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { FormModal } from '@/components/admin/FormModal.jsx';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog.jsx';
import { ImageUpload } from '@/components/admin/ImageUpload.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import pb from '@/lib/pocketbaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';
import { saveRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function DiningManagement() {
  const [dining, setDining] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentDining, setCurrentDining] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '', description: '', cuisine_type: '', amenities: '', image: null
  });

  const fetchDining = async () => {
    try {
      const records = await pb.collection('dining').getFullList({ sort: '-created', $autoCancel: false });
      setDining(records);
    } catch (err) {
      toast.error('Failed to load dining options');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDining(); }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setCurrentDining(item);
      setFormData({
        name: item.name || '', 
        description: item.description || '', 
        cuisine_type: item.cuisine_type || '', 
        amenities: item.amenities || '', 
        image: null
      });
    } else {
      setCurrentDining(null);
      setFormData({ name: '', description: '', cuisine_type: '', amenities: '', image: null });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('cuisine_type', formData.cuisine_type);
    data.append('amenities', formData.amenities);
    if (formData.image instanceof File) {
      data.append('image', formData.image);
    }

    const result = await saveRecord('dining', data, currentDining?.id);
    setActionLoading(false);

    if (result.success) {
      toast.success(`Dining option ${currentDining ? 'updated' : 'created'}`);
      setIsModalOpen(false);
      fetchDining();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const result = await deleteRecord('dining', currentDining.id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Deleted successfully');
      setIsConfirmOpen(false);
      fetchDining();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Manage Dining | Raya Admin</title></Helmet>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Dining Options</h1>
          <p className="text-muted-foreground mt-1">Manage restaurant and bar offerings</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Dining Option
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dining.map(item => (
            <div key={item.id} className="bg-card rounded-2xl overflow-hidden border border-border shadow-sm flex flex-col">
              <div className="h-48 relative">
                {item.image ? (
                  <img src={pb.files.getURL(item, item.image)} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleOpenModal(item)} className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="destructive" onClick={() => { setCurrentDining(item); setIsConfirmOpen(true); }} className="h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-primary font-semibold uppercase tracking-wider mb-1">{item.cuisine_type}</div>
                <h3 className="text-xl font-bold font-serif mb-2">{item.name}</h3>
                <p className="text-muted-foreground text-sm line-clamp-3">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentDining ? 'Edit Dining' : 'Add Dining Option'} onSubmit={handleSubmit} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div>
            <Label>Cuisine Type</Label>
            <Input required value={formData.cuisine_type} onChange={e => setFormData({...formData, cuisine_type: e.target.value})} />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
          </div>
          <div>
            <Label>Amenities / Features</Label>
            <Input value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} placeholder="Live music, Outdoor seating" />
          </div>
          <div>
            <Label>Image</Label>
            <ImageUpload value={formData.image} onChange={f => setFormData({...formData, image: f})} previewUrl={currentDining?.image ? pb.files.getURL(currentDining, currentDining.image) : null} />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Delete Option" description={`Delete "${currentDining?.name}"?`} loading={actionLoading} />
    </AdminLayout>
  );
}