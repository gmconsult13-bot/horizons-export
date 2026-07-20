import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Pencil, Trash2, Tag, CheckCircle2, XCircle } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import DealForm from '@/components/admin/DealForm.jsx';
import { saveRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function GuestDealsManagement() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const records = await pb.collection('guest_deals').getFullList({
        sort: '-created',
        $autoCancel: false
      });
      setDeals(records);
    } catch (error) {
      toast.error('Failed to load guest deals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    
    const result = await deleteRecord('guest_deals', id);
    if (result.success) {
      toast.success('Deal deleted successfully');
      fetchDeals();
    } else {
      toast.error(result.error);
    }
  };

  const handleToggleActive = async (deal) => {
    const result = await saveRecord('guest_deals', { is_active: !deal.is_active }, deal.id);
    if (result.success) {
      toast.success(`Deal marked as ${!deal.is_active ? 'active' : 'inactive'}`);
      fetchDeals();
    } else {
      toast.error(result.error);
    }
  };

  const openEditModal = (deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setSelectedDeal(null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchDeals();
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Manage Guest Deals | Admin</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Tag className="h-8 w-8 text-primary" />
            Guest Deals
          </h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional offers for guests.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateModal} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" /> Create Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedDeal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
            </DialogHeader>
            <DealForm 
              deal={selectedDeal} 
              onSuccess={handleModalSuccess} 
              onCancel={() => setIsModalOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Deal Title</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Valid From</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading deals...
                </TableCell>
              </TableRow>
            ) : deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No promotional deals found. Click "Create Deal" to add one.
                </TableCell>
              </TableRow>
            ) : (
              deals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    {deal.title}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                      {deal.discount_percentage}% OFF
                    </span>
                  </TableCell>
                  <TableCell>{new Date(deal.start_date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(deal.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <button 
                      onClick={() => handleToggleActive(deal)}
                      className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
                    >
                      {deal.is_active ? (
                        <span className="inline-flex items-center gap-1 text-success text-sm font-medium">
                          <CheckCircle2 className="h-4 w-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-muted-foreground text-sm font-medium">
                          <XCircle className="h-4 w-4" /> Inactive
                        </span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(deal)} title="Edit Deal">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(deal.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete Deal">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}