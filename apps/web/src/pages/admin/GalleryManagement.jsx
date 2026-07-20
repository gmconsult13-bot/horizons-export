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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { Skeleton } from '@/components/ui/skeleton';
import { saveRecord, createRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function GalleryManagement() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [formData, setFormData] = useState({ title: '', description: '', category: 'exterior', files: [] });

  const fetchImages = async () => {
    try {
      const records = await pb.collection('gallery').getFullList({ sort: '-created', $autoCancel: false });
      setImages(records);
    } catch (err) {
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchImages(); }, []);

  const handleOpenModal = (img = null) => {
    if (img) {
      setCurrentImage(img);
      setFormData({ title: img.title || '', description: img.description || '', category: img.category || 'exterior', files: [] });
    } else {
      setCurrentImage(null);
      setFormData({ title: '', description: '', category: 'exterior', files: [] });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    
    if (currentImage) {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('category', formData.category);
      if (formData.files.length > 0 && formData.files[0] instanceof File) {
        data.append('image', formData.files[0]);
      }
      
      const result = await saveRecord('gallery', data, currentImage.id);
      
      if (result.success) {
        toast.success('Image updated');
        setIsModalOpen(false);
        fetchImages();
      } else {
        toast.error(result.error);
      }
    } else {
      if (formData.files.length === 0) {
        toast.error('Please select at least one image');
        setActionLoading(false);
        return;
      }
      
      const promises = formData.files.map((file, idx) => {
        const data = new FormData();
        data.append('title', formData.files.length > 1 ? `${formData.title} ${idx + 1}` : formData.title);
        data.append('description', formData.description);
        data.append('category', formData.category);
        data.append('image', file);
        return createRecord('gallery', data);
      });
      
      const results = await Promise.all(promises);
      const errors = results.filter(r => !r.success);
      
      if (errors.length > 0) {
        toast.error(`${errors.length} image(s) failed to upload`);
      }
      
      if (errors.length < results.length) {
        toast.success(`${results.length - errors.length} image(s) uploaded`);
        setIsModalOpen(false);
        fetchImages();
      }
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    setActionLoading(true);
    const result = await deleteRecord('gallery', currentImage.id);
    setActionLoading(false);

    if (result.success) {
      toast.success('Image deleted');
      setIsConfirmOpen(false);
      fetchImages();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Gallery Management | Raya Admin</title></Helmet>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Gallery Management</h1>
          <p className="text-muted-foreground mt-1">Upload and organize hotel photos</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Upload Photos
        </Button>
      </div>

      {loading ? (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className={`w-full rounded-xl mb-4 ${i%2===0 ? 'h-64' : 'h-48'}`} />)}
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map(img => (
            <div key={img.id} className="relative group break-inside-avoid rounded-xl overflow-hidden shadow-sm">
              <img src={pb.files.getURL(img, img.image, { thumb: '300x300' })} alt={img.title} className="w-full object-cover" />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => handleOpenModal(img)}><Edit className="w-4 h-4" /></Button>
                  <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => { setCurrentImage(img); setIsConfirmOpen(true); }}><Trash2 className="w-4 h-4" /></Button>
                </div>
                <h4 className="text-white font-medium truncate">{img.title}</h4>
                <p className="text-white/70 text-xs uppercase">{img.category}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentImage ? 'Edit Image' : 'Upload Photos'} onSubmit={handleSubmit} loading={actionLoading}>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder={!currentImage ? "Base title for uploads" : ""} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={formData.category} onValueChange={v => setFormData({...formData, category: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="amenity">Amenity</SelectItem>
                <SelectItem value="dining">Dining</SelectItem>
                <SelectItem value="lobby">Lobby</SelectItem>
                <SelectItem value="exterior">Exterior</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Description (Optional)</Label>
            <Input value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div>
            <Label>{currentImage ? 'Replace Image (Optional)' : 'Images'}</Label>
            <ImageUpload 
              multiple={!currentImage}
              value={formData.files} 
              onChange={f => setFormData({...formData, files: Array.isArray(f) ? f : (f ? [f] : [])})} 
              previewUrl={currentImage?.image ? pb.files.getURL(currentImage, currentImage.image) : null} 
            />
          </div>
        </div>
      </FormModal>

      <ConfirmDialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} onConfirm={handleDelete} title="Delete Image" description={`Delete "${currentImage?.title}"?`} loading={actionLoading} />
    </AdminLayout>
  );
}