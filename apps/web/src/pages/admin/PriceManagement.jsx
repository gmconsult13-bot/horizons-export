import React, { useEffect, useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Edit2, Trash2, SlidersHorizontal, RefreshCw, Baby, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import PriceForm from '@/components/admin/PriceForm.jsx';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient.js';
import { saveRecord, deleteRecord } from '@/utils/adminSaveUtils.js';

export default function PriceManagement() {
  const [prices, setPrices] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [childrenSurcharges, setChildrenSurcharges] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [filterSeason, setFilterSeason] = useState('all');
  const [filterRoom, setFilterRoom] = useState('all');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrice, setEditingPrice] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [pricesRes, roomsRes, seasonsRes, surchargesRes] = await Promise.all([
        pb.collection('prices').getFullList({ sort: 'room_type,season', $autoCancel: false }),
        pb.collection('rooms').getFullList({ sort: 'name', $autoCancel: false }),
        pb.collection('seasons').getFullList({ sort: 'start_date', $autoCancel: false }),
        pb.collection('children_surcharges').getFullList({ sort: 'min_age', $autoCancel: false })
      ]);
      setPrices(pricesRes);
      setRooms(roomsRes);
      setSeasons(seasonsRes);
      setChildrenSurcharges(surchargesRes);
    } catch (err) {
      setError('Failed to load pricing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (priceData) => {
    const result = await saveRecord('prices', priceData, editingPrice?.id);
    if (result.success) {
      toast.success(`Price rule ${editingPrice ? 'updated' : 'created'} successfully`);
      setIsModalOpen(false);
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pricing rule?')) return;
    
    const result = await deleteRecord('prices', id);
    if (result.success) {
      toast.success('Pricing rule deleted');
      fetchData();
    } else {
      toast.error(result.error);
    }
  };

  const openCreateModal = () => {
    setEditingPrice(null);
    setIsModalOpen(true);
  };

  const openEditModal = (price) => {
    setEditingPrice(price);
    setIsModalOpen(true);
  };

  const filteredPrices = useMemo(() => {
    return prices.filter(p => {
      if (filterSeason !== 'all' && p.season !== filterSeason) return false;
      if (filterRoom !== 'all' && p.room_type !== filterRoom) return false;
      return true;
    });
  }, [prices, filterSeason, filterRoom]);

  return (
    <AdminLayout>
      <Helmet><title>Pricing Management | Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Pricing Database</h1>
          <p className="text-muted-foreground mt-1">Manage seasonal rates and guest surcharges.</p>
        </div>
        <Button onClick={openCreateModal} className="bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Add Price Rule
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border flex flex-wrap gap-4 items-center mb-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <div className="w-48">
          <Select value={filterSeason} onValueChange={setFilterSeason}>
            <SelectTrigger><SelectValue placeholder="All Seasons" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Seasons</SelectItem>
              {seasons.map(s => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={filterRoom} onValueChange={setFilterRoom}>
            <SelectTrigger><SelectValue placeholder="All Rooms" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map(r => (
                <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden mb-12">
        {error ? (
          <div className="p-12 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchData} variant="outline"><RefreshCw className="w-4 h-4 mr-2" /> Retry</Button>
          </div>
        ) : loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : filteredPrices.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <SlidersHorizontal className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-serif mb-2">No prices found</h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              You haven't set up pricing for this combination yet. Create rules to establish base rates.
            </p>
            <Button onClick={openCreateModal}>Create First Rule</Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Room Type</TableHead>
                <TableHead>Season</TableHead>
                <TableHead className="text-right">Base Price</TableHead>
                <TableHead className="text-right">+ Adult</TableHead>
                <TableHead className="text-right">+ Child</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrices.map((price) => (
                <TableRow key={price.id}>
                  <TableCell className="font-medium">{price.room_type}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary-foreground">
                      {price.season}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">€{price.base_price.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">€{price.additional_guest_surcharge.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">€{price.child_surcharge.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditModal(price)}>
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(price.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Children Surcharges Reference Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div>
            <h2 className="text-xl font-bold font-serif flex items-center gap-2">
              <Baby className="w-5 h-5 text-primary" />
              Children Surcharges Reference
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Age-based tiers applied dynamically at checkout.</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/admin/children-surcharges">
              Manage Children Surcharges <ArrowUpRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : childrenSurcharges.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No children surcharges defined yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Age Range</TableHead>
                  <TableHead>Surcharge Amount</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {childrenSurcharges.map((surcharge) => (
                  <TableRow key={surcharge.id}>
                    <TableCell className="font-medium">
                      {surcharge.min_age} to {surcharge.max_age} years
                    </TableCell>
                    <TableCell>
                      {surcharge.surcharge_amount === 0 
                        ? <span className="text-emerald-600 font-medium text-sm">Free</span> 
                        : `€${surcharge.surcharge_amount.toFixed(2)}`}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {surcharge.description || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <PriceForm 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingPrice}
        rooms={rooms}
        seasons={seasons}
      />
    </AdminLayout>
  );
}