import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { DataTable } from '@/components/admin/DataTable.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { deleteRecord, saveRecord } from '@/utils/adminSaveUtils.js';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let filterStr = '';
      const filters = [];
      
      if (searchTerm) {
        filters.push(`(guest_name ~ "${searchTerm}" || guest_email ~ "${searchTerm}")`);
      }
      
      if (statusFilter !== 'all') {
        filters.push(`payment_status="${statusFilter}"`);
      }

      if (filters.length > 0) {
        filterStr = filters.join(' && ');
      }

      const result = await pb.collection('bookings').getList(1, 100, {
        filter: filterStr,
        sort: '-created',
        $autoCancel: false
      });
      
      setBookings(result.items);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchBookings();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter]);

  const handleMarkCompleted = async (id) => {
    try {
      const result = await saveRecord('bookings', { payment_status: 'completed' }, id);
      if (!result.success) throw new Error(result.error);
      toast.success('Booking marked as completed');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to update booking');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this booking?')) return;
    try {
      const result = await deleteRecord('bookings', id);
      if (!result.success) throw new Error(result.error);
      toast.success('Booking deleted');
      fetchBookings();
    } catch (error) {
      toast.error('Failed to delete booking');
    }
  };

  const columns = [
    { header: 'Guest', render: (r) => <div><div className="font-medium">{r.guest_name}</div><div className="text-xs text-muted-foreground">{r.guest_email}</div></div> },
    { header: 'Accommodation', accessor: 'accommodationType' },
    { header: 'Dates', render: (r) => <span className="text-sm">{r.check_in_date} to {r.check_out_date}</span> },
    { header: 'Total', render: (r) => <span className="font-medium">${r.final_price?.toFixed(2)}</span> },
    { 
      header: 'Status', 
      render: (r) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          r.payment_status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 
          r.payment_status === 'failed' ? 'bg-red-100 text-red-800' : 
          'bg-amber-100 text-amber-800'
        }`}>
          {r.payment_status}
        </span>
      )
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex gap-2">
          {r.payment_status !== 'completed' && (
            <Button variant="outline" size="sm" onClick={() => handleMarkCompleted(r.id)}>Complete</Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => handleDelete(r.id)}>Delete</Button>
        </div>
      )
    }
  ];

  return (
    <AdminLayout>
      <Helmet><title>Manage Bookings | Raya Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground">Bookings</h1>
          <p className="text-muted-foreground mt-1">Manage all reservations</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search guest name/email" 
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No bookings found matching your criteria.
          </div>
        ) : (
          <DataTable columns={columns} data={bookings} />
        )}
      </div>
    </AdminLayout>
  );
}
