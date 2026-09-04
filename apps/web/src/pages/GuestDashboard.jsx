import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, Loader2, XCircle, ShieldCheck, ShieldAlert, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { useGuestAuth } from '@/contexts/GuestAuthContext.jsx';

export default function GuestDashboard() {
  const { currentGuest } = useGuestAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [invoiceByBooking, setInvoiceByBooking] = useState({});

  const fetchInvoices = async (bookingIds) => {
    if (!bookingIds.length) return;
    try {
      const filter = bookingIds.map((id) => `booking="${id}"`).join(' || ');
      const result = await pb.collection('invoices').getList(1, 50, {
        filter,
        $autoCancel: false,
      });
      const map = {};
      result.items.forEach((inv) => {
        if (inv.booking) map[typeof inv.booking === 'object' ? inv.booking.id : inv.booking] = inv.id;
      });
      setInvoiceByBooking(map);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const fetchBookings = async () => {
    if (!currentGuest?.id) return;
    try {
      const result = await pb.collection('bookings').getList(1, 50, {
        filter: `guest_id="${currentGuest.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      setBookings(result.items);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentGuest]);

  useEffect(() => {
    if (bookings.length > 0) {
      fetchInvoices(bookings.map((b) => b.id));
    }
  }, [bookings]);

  const getStatusBadge = (booking) => {
    if (booking.booking_status === 'cancelled') {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Cancelled</span>;
    }
    switch (booking.payment_status) {
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">Confirmed</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">Pending</span>;
      case 'failed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Failed</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">{booking.payment_status}</span>;
    }
  };

  const isUpcoming = (booking) => {
    const checkIn = new Date(booking.check_in_date);
    return checkIn >= new Date(new Date().toDateString());
  };

  const isRefundable = (booking) => booking.cancellation_policy !== 'non_refundable';

  // Paid bookings show their invoice for 3 months after the stay.
  const showInvoice = (booking) =>
    booking.payment_status === 'completed' && invoiceByBooking[booking.id] !== undefined;

  const isInvoicePrintable = (booking) => {
    const end = new Date(booking.check_out_date);
    end.setMonth(end.getMonth() + 3);
    return new Date() <= end;
  };
  const canCancel = (booking) => booking.booking_status !== 'cancelled' && booking.payment_status !== 'failed' && isUpcoming(booking) && isRefundable(booking);

  const handleCancel = async (bookingId) => {
    setCancellingId(bookingId);
    try {
      // The cancel endpoint authenticates against the 'guests' collection,
      // so we must explicitly send the guest's PocketBase token —
      // apiServerClient only auto-attaches admin tokens.
      const res = await apiServerClient.fetch(`/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${pb.authStore.token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to cancel booking');

      if (data.refund_status === 'full') {
        toast.success('Booking cancelled. Full refund issued.', { description: `€${(data.refund_amount || 0).toFixed(2)} will be returned to your card.` });
      } else if (data.refund_status === 'partial') {
        toast.success('Booking cancelled. Partial refund issued.', { description: `€${(data.refund_amount || 0).toFixed(2)} will be returned to your card.` });
      } else {
        toast.success('Booking cancelled.', { description: 'This booking was non-refundable, so no refund was issued.' });
      }

      setConfirmingId(null);
      fetchBookings();
    } catch (error) {
      console.error('Cancel booking error:', error);
      toast.error('Could not cancel booking', { description: error.message });
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>My Bookings | Raya Boutique</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h1 className="text-4xl font-bold text-foreground">My Bookings</h1>
              <p className="text-muted-foreground mt-2">Manage your upcoming and past stays.</p>
            </div>
            <Button asChild>
              <Link to="/booking">New Booking</Link>
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-12 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">You haven't made any reservations yet.</p>
              <Button asChild variant="outline">
                <Link to="/booking">Explore Rooms</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-6">
              {bookings.map((booking) => (
                <div key={booking.id} className="bg-card border border-border rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 transition-all hover:shadow-md">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{booking.accommodationType || booking.room_type}</h3>
                      {getStatusBadge(booking)}
                      {booking.booking_status !== 'cancelled' && !isRefundable(booking) && (
                        <span className="text-xs text-muted-foreground">To change this booking, contact us at info@rayaboutique.eu</span>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {booking.check_in_date?.slice(0,10)} to {booking.check_out_date?.slice(0,10)}</span>
                      <span className="flex items-center gap-1"><CreditCard className="w-4 h-4" /> €{Number(booking.final_price || 0).toFixed(2)}</span>
                      <span className={`flex items-center gap-1 ${booking.cancellation_policy === 'flexible' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {booking.cancellation_policy === 'flexible' ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                        {booking.cancellation_policy === 'flexible' ? 'Free cancellation up to 3 days before check-in' : 'Non-refundable rate'}
                      </span>
                    </div>
                    {booking.refund_status && booking.refund_status !== 'none' && (
                      <p className="text-xs text-muted-foreground">Refund: {booking.refund_status} {booking.refund_amount ? `(€${Number(booking.refund_amount).toFixed(2)})` : ''}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {canCancel(booking) && (
                      confirmingId === booking.id ? (
                        <div className="flex gap-2 items-center">
                          <span className="text-xs text-muted-foreground">Are you sure?</span>
                          <Button size="sm" variant="destructive" disabled={cancellingId === booking.id} onClick={() => handleCancel(booking.id)}>
                            {cancellingId === booking.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, cancel'}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setConfirmingId(null)}>Back</Button>
                        </div>
                      ) : (
                        <Button variant="outline" className="text-destructive" onClick={() => setConfirmingId(booking.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Cancel Booking
                        </Button>
                      )
                    )}
                    {showInvoice(booking) && (
                      <Button
                        asChild={isInvoicePrintable(booking)}
                        variant="outline"
                        disabled={!isInvoicePrintable(booking)}
                        onClick={!isInvoicePrintable(booking) ? () => toast.info('The printable period for this invoice has expired. Contact info@rayaboutique.eu for a copy.') : undefined}
                      >
                        {isInvoicePrintable(booking) ? (
                          <Link to={`/invoice/${invoiceByBooking[booking.id]}`}><FileText className="w-4 h-4 mr-1" /> Фактура</Link>
                        ) : (
                          <><FileText className="w-4 h-4 mr-1" /> Фактура</>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
