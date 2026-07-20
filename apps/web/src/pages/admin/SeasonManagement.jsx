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

export default function SeasonManagement() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editingSeason, setEditingSeason] = useState(null);
  const [deletingSeason, setDeletingSeason] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    pricing_multiplier: 1.0,
    description: ''
  });

  const fetchSeasons = async () => {
    try {
      const records = await pb.collection('seasons').getFullList({ sort: '-start_date', $autoCancel: false });
      setSeasons(records);
    } catch (err) {
      toast.error('Failed to fetch seasons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSeasons(); }, []);

  const handleOpenModal = (season = null) => {
    if (season) {
      setEditingSeason(season);
      setFormData({
        name: season.name,
        start_date: season.start_date ? season.start_date.substring(0, 10) : '',
        end_date: season.end_date ? season.end_date.substring(0, 10) : '',
        pricing_multiplier: season.pricing_multiplier,
        description: season.description || ''
      });
    } else {
      setEditingSeason(null);
      setFormData({ name: '', start_date: '', end_date: '', pricing_multiplier: 1.0, description: '' });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);

    if (endDate <= startDate) {
      toast.error('Validation Error: End date must be strictly after the start date.');
      return;
    }

    const payload = {
      name: formData.name,
      start_date: formData.start_date, // auto-converted to ISO by saveRecord
      end_date: formData.end_date,
      pricing_multiplier: Number(formData.pricing_multiplier),
      description: formData.description || ''
    };

    const result = await saveRecord('seasons', payload, editingSeason?.id);
    
    if (result.success) {
      toast.success(`Season ${editingSeason ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
      fetchSeasons();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async () => {
    if (!deletingSeason) return;
    
    const result = await deleteRecord('seasons', deletingSeason.id);
    
    if (result.success) {
      toast.success('Season deleted successfully');
      fetchSeasons();
    } else {
      toast.error(result.error);
    }
    setDeleteOpen(false);
  };

  return (
    <AdminLayout>
      <Helmet><title>Seasons | Admin</title></Helmet>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif">Seasonal Pricing</h1>
          <p className="text-muted-foreground">Define seasons and pricing multipliers</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-primary">
          <Plus className="w-4 h-4 mr-2" /> Add Season
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Season Name</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Multiplier</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : seasons.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No seasons defined.</TableCell></TableRow>
            ) : (
              seasons.map(season => (
                <TableRow key={season.id}>
                  <TableCell className="font-medium">{season.name}</TableCell>
                  <TableCell>{new Date(season.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(season.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{season.pricing_multiplier}x</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(season)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => { setDeletingSeason(season); setDeleteOpen(true); }}>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSeason ? 'Edit Season' : 'Add New Season'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Season Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Summer Peak" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Pricing Multiplier (0.5 - 3.0)</Label>
              <Input type="number" required min="0.5" max="3.0" step="0.1" value={formData.pricing_multiplier} onChange={e => setFormData({...formData, pricing_multiplier: parseFloat(e.target.value)})} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={2} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button type="submit">Save Season</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting season "{deletingSeason?.name}" will revert room prices for those dates back to their base rate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}