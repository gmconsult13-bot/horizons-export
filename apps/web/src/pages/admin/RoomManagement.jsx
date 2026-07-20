import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import pb from '@/lib/pocketbaseClient.js';
import { saveRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function RoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [deletingRoom, setDeletingRoom] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 2,
    capacity_beds: 1,
    capacity_extra_beds: 0,
    total_rooms: 1,
    available_rooms: 1,
    price: 100,
    amenities: '',
    image: null
  });

  const fetchRooms = async () => {
    try {
      const records = await pb.collection('rooms').getFullList({ sort: '-created', $autoCancel: false });
      setRooms(records);
    } catch (err) {
      toast.error('Failed to fetch rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleOpenModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setFormData({
        name: room.name || '',
        description: room.description || '',
        capacity: Number(room.capacity) || 2,
        capacity_beds: Number(room.capacity_beds) || 1,
        capacity_extra_beds: Number(room.capacity_extra_beds) || 0,
        total_rooms: Number(room.total_rooms) || 1,
        available_rooms: Number(room.available_rooms) || 1,
        price: Number(room.price) || 100,
        amenities: room.amenities || '',
        image: null
      });
    } else {
      setEditingRoom(null);
      setFormData({ 
        name: '', 
        description: '', 
        capacity: 2, 
        capacity_beds: 1,
        capacity_extra_beds: 0,
        total_rooms: 1,
        available_rooms: 1,
        price: 100, 
        amenities: '', 
        image: null 
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    const extraBedsValue = isNaN(formData.capacity_extra_beds) || formData.capacity_extra_beds === '' ? 0 : Number(formData.capacity_extra_beds);
    const capacityValue = isNaN(formData.capacity) ? 1 : Number(formData.capacity);
    const bedsValue = isNaN(formData.capacity_beds) ? 1 : Number(formData.capacity_beds);
    const priceValue = isNaN(formData.price) ? 0 : Number(formData.price);
    const totalRoomsValue = isNaN(formData.total_rooms) ? 1 : Number(formData.total_rooms);
    const availableRoomsValue = isNaN(formData.available_rooms) ? 1 : Number(formData.available_rooms);
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('capacity', capacityValue);
    data.append('capacity_beds', bedsValue);
    data.append('capacity_extra_beds', extraBedsValue);
    data.append('total_rooms', totalRoomsValue);
    data.append('available_rooms', availableRoomsValue);
    data.append('price', priceValue);
    data.append('amenities', formData.amenities);
    
    if (formData.image instanceof File) {
      data.append('image', formData.image);
    }

    const result = await saveRecord('rooms', data, editingRoom?.id);
    
    if (result.success) {
      toast.success(`Room ${editingRoom ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
      fetchRooms();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingRoom) return;
    
    const result = await deleteRecord('rooms', deletingRoom.id);
    
    if (result.success) {
      toast.success('Room deleted');
      fetchRooms();
    } else {
      toast.error(result.error);
    }
    setDeleteOpen(false);
  };

  return (
    <AdminLayout>
      <Helmet><title>Manage Rooms | Admin</title></Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Rooms</h1>
          <p className="text-muted-foreground">Manage your property's accommodations</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary text-primary-foreground">
          <Plus className="w-4 h-4 mr-2" /> Add Room
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Total Capacity</TableHead>
              <TableHead>Beds</TableHead>
              <TableHead>Inventory</TableHead>
              <TableHead>Base Price</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : rooms.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No rooms found.</TableCell></TableRow>
            ) : (
              rooms.map(room => (
                <TableRow key={room.id}>
                  <TableCell>
                    {room.image ? (
                      <div className="w-16 h-12 rounded overflow-hidden bg-muted">
                        <img src={pb.files.getURL(room, room.image)} alt={room.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{room.name}</TableCell>
                  <TableCell>{room.capacity} Guests</TableCell>
                  <TableCell>{room.capacity_beds} (+{room.capacity_extra_beds || 0})</TableCell>
                  <TableCell>{room.available_rooms} / {room.total_rooms}</TableCell>
                  <TableCell>€{room.price}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(room)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setDeletingRoom(room); setDeleteOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Room Name</Label>
                <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Image Upload</Label>
                <Input type="file" accept="image/*" onChange={e => setFormData({...formData, image: e.target.files[0]})} />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-2">
                <Label>Total Capacity</Label>
                <Input type="number" required min="1" value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Standard Beds</Label>
                <Input type="number" required min="1" value={formData.capacity_beds} onChange={e => setFormData({...formData, capacity_beds: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Extra Beds</Label>
                <Input type="number" min="0" value={formData.capacity_extra_beds} onChange={e => setFormData({...formData, capacity_extra_beds: e.target.value})} placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-2">
                <Label>Total Rooms (Inventory)</Label>
                <Input type="number" required min="1" value={formData.total_rooms} onChange={e => setFormData({...formData, total_rooms: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Available Rooms</Label>
                <Input type="number" required min="0" value={formData.available_rooms} onChange={e => setFormData({...formData, available_rooms: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Base Price (€)</Label>
                <Input type="number" required min="0" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Amenities (comma separated)</Label>
              <Textarea rows={2} value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} placeholder="Wi-Fi, Balcony, Minibar..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Room</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the room "{deletingRoom?.name}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}