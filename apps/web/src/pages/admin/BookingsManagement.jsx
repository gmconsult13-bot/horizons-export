import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminSidebar.jsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import pb from '@/lib/pocketbaseClient.js';
import { checkAdminAuth } from '@/utils/adminSaveUtils.js';

export default function BookingsManagement() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const fetchBookings = async () => {
    setLoading(true);
    try {
      checkAdminAuth();
      let filterStr = '';
      if (statusFilter !== 'all') {
        filterStr = `payment_status = "${statusFilter}"`;
      }

      const result = await pb.collection('bookings').getList(page, 15, {
        sort: '-created',
        filter: filterStr,
        $autoCancel: false
      });
      
      setBookings(result.items);
      setTotalPages(result.totalPages);
    } catch (err) {
      toast.error(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <Helmet><title>Manage Bookings | Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Bookings</h1>
          <p className="text-muted-foreground">View and manage guest reservations</p>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Guest</TableHead>
              <TableHead>Room Type</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Guests</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Loading...</TableCell></TableRow>
            ) : bookings.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No bookings found.</TableCell></TableRow>
            ) : (
              bookings.map(booking => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="font-medium">{booking.guest_name}</div>
                    <div className="text-xs text-muted-foreground">{booking.guest_email}</div>
                  </TableCell>
                  <TableCell className="capitalize">{booking.room_type}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(booking.check_in_date).toLocaleDateString()} &rarr; <br/>
                      {new Date(booking.check_out_date).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>{booking.number_of_guests}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedBooking(booking)}>
                      <Eye className="w-4 h-4 text-primary" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
          <span className="text-sm font-medium">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}

      {/* Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4 text-sm mt-4">
              <div className="grid grid-cols-2 gap-4 bg-muted p-4 rounded-lg">
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Guest</div>
                  <div className="font-semibold">{selectedBooking.guest_name}</div>
                  <div>{selectedBooking.guest_email}</div>
                  <div>{selectedBooking.guest_phone || 'No phone'}</div>
                </div>
                <div>
                  <div className="text-muted-foreground font-medium mb-1">Reservation</div>
                  <div className="capitalize">{selectedBooking.room_type} Room</div>
                  <div>{selectedBooking.number_of_guests} Guests ({selectedBooking.num_adults}A, {selectedBooking.num_children}C)</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-muted-foreground font-medium mb-1">Check-in</div>
                  <div className="font-semibold">{new Date(selectedBooking.check_in_date).toLocaleDateString()}</div>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <div className="text-muted-foreground font-medium mb-1">Check-out</div>
                  <div className="font-semibold">{new Date(selectedBooking.check_out_date).toLocaleDateString()}</div>
                </div>
              </div>

              <div className="bg-card border border-border p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meal Plan:</span>
                  <span className="capitalize">{selectedBooking.meal_plan.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Special Requests:</span>
                  <span>{selectedBooking.special_requests || 'None'}</span>
                </div>
                <div className="pt-2 border-t mt-2 flex justify-between font-bold text-lg">
                  <span>Total Paid:</span>
                  <span>€{selectedBooking.final_price}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}