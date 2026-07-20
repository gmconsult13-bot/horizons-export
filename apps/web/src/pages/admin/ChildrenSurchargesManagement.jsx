import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Trash2, Baby, Loader2, Plus, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { saveRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function ChildrenSurchargesManagement() {
  const [formData, setFormData] = useState({
    min_age: '',
    max_age: '',
    surcharge_amount: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [surcharges, setSurcharges] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const isEmpty = (value) => value === '' || value === null || value === undefined;

  const fetchSurcharges = async () => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const records = await pb.collection('children_surcharges').getFullList({
        sort: 'min_age',
        $autoCancel: false
      });
      setSurcharges(records);
    } catch (err) {
      setListError('Failed to load children surcharges.');
      toast.error('Could not fetch existing surcharges.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchSurcharges();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isEmpty(formData.min_age) || isEmpty(formData.surcharge_amount)) {
      toast.error('Validation Error: Minimum Age and Surcharge Amount are required.');
      return;
    }

    const payload = {
      min_age: Number(formData.min_age),
      max_age: isEmpty(formData.max_age) ? 99 : Number(formData.max_age),
      surcharge_amount: Number(formData.surcharge_amount),
      description: formData.description || ''
    };

    if (isNaN(payload.min_age) || isNaN(payload.surcharge_amount)) {
      toast.error('Validation Error: Age and Amount must be valid numbers.');
      return;
    }

    setIsSubmitting(true);
    
    const result = await saveRecord('children_surcharges', payload);
    
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Surcharge tier created successfully!');
      setFormData({ min_age: '', max_age: '', surcharge_amount: '', description: '' });
      fetchSurcharges();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id) => {
    const result = await deleteRecord('children_surcharges', id);
    if (result.success) {
      toast.success('Surcharge tier deleted.');
      fetchSurcharges();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Children Surcharges | Admin</title></Helmet>
      <div className="max-w-5xl mx-auto space-y-10">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight text-balance">Children Surcharges</h1>
          <p className="text-muted-foreground mt-2">Create and manage age-based pricing rules for young guests.</p>
        </div>

        <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20">
            <h2 className="text-xl font-semibold flex items-center">
              <Plus className="w-5 h-5 mr-2 text-primary" /> Add New Tier
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="min_age">Minimum Age <span className="text-destructive">*</span></Label>
                <Input id="min_age" name="min_age" type="number" min="0" step="1" value={formData.min_age} onChange={handleChange} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_age">Maximum Age</Label>
                <Input id="max_age" name="max_age" type="number" min="0" step="1" value={formData.max_age} onChange={handleChange} disabled={isSubmitting} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surcharge_amount">Surcharge Amount (€) <span className="text-destructive">*</span></Label>
                <Input id="surcharge_amount" name="surcharge_amount" type="number" min="0" step="0.01" value={formData.surcharge_amount} onChange={handleChange} disabled={isSubmitting} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={2} value={formData.description} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting} className="bg-primary text-primary-foreground min-w-[140px]">
                {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Create Tier'}
              </Button>
            </div>
          </form>
        </section>

        <section className="bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden">
          <div className="p-6 border-b border-border bg-muted/20 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Existing Tiers</h2>
            <Button variant="outline" size="sm" onClick={fetchSurcharges} disabled={isLoadingList}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingList ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          <div className="p-0">
            {listError ? (
              <div className="p-12 text-center">
                <p className="text-destructive mb-4">{listError}</p>
                <Button onClick={fetchSurcharges} variant="outline">Try Again</Button>
              </div>
            ) : isLoadingList ? (
              <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-full rounded-lg bg-muted" />
                <Skeleton className="h-12 w-full rounded-lg bg-muted" />
              </div>
            ) : surcharges.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center">
                <Baby className="w-12 h-12 mb-4 text-muted-foreground/30" />
                <h3 className="text-lg font-medium">No tiers configured</h3>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Age Range</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {surcharges.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.min_age} – {item.max_age === 99 ? '99+' : item.max_age} yrs</TableCell>
                      <TableCell>{item.surcharge_amount === 0 ? 'Free' : `€${item.surcharge_amount.toFixed(2)}`}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </section>
      </div>
    </AdminLayout>
  );
}