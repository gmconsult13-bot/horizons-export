import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, Home, User, CreditCard, FileText, ArrowRight, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';
import apiServerClient from '@/lib/apiServerClient.js';

const statusColors = {
  available: { bg: 'bg-emerald-500', text: 'text-white', label: 'Available' },
  arriving: { bg: 'bg-amber-500', text: 'text-white', label: 'Arriving Today' },
  occupied: { bg: 'bg-blue-500', text: 'text-white', label: 'Occupied' },
  departing: { bg: 'bg-purple-500', text: 'text-white', label: 'Departing Today' },
  dirty: { bg: 'bg-orange-500', text: 'text-white', label: 'Needs Cleaning' },
  maintenance: { bg: 'bg-gray-500', text: 'text-white', label: 'Maintenance' },
};

export default function PMSRoomScheme() {
  const [loading, setLoading] = useState(true);
  const [floors, setFloors] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRoomScheme = async () => {
    setLoading(true);
    try {
      const res = await apiServerClient.fetch('/pms/room-scheme');
      if (!res.ok) throw new Error('Failed to load room scheme');
      const data = await res.json();
      setFloors(data.floors || []);
    } catch (error) {
      console.error('Room scheme fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomScheme();
  }, []);

  const handleRoomClick = (room) => {
    setSelectedRoom(room);
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const res = await apiServerClient.fetch(`/pms/bookings/${bookingId}/check-in`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchRoomScheme();
        setSelectedRoom(null);
      }
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Helmet>
        <title>Room Scheme | Raya Boutique PMS</title>
      </Helmet>
      <Header />

      <main className="flex-grow py-6">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Home className="w-7 h-7 text-primary" />
              Room Scheme
            </h1>
            <p className="text-muted-foreground mt-1">
              Click any room to view guest details, issue invoices, or manage the stay.
            </p>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-6">
            {Object.entries(statusColors).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${val.bg}`} />
                <span className="text-xs text-muted-foreground">{val.label}</span>
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-8">
              {floors.map((floor) => (
                <div key={floor.floor} className="bg-card rounded-2xl border border-border p-6">
                  <h2 className="text-xl font-semibold mb-4 text-foreground">
                    Floor {floor.floor}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {floor.rooms.map((room) => {
                      const status = statusColors[room.status] || statusColors.available;
                      return (
                        <button
                          key={room.id}
                          onClick={() => handleRoomClick(room)}
                          className={`relative rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-lg ${status.bg} ${status.text} min-h-[120px]`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-lg font-bold">{room.room_number}</div>
                              {room.view_type && (
                                <div className="text-xs opacity-80 mt-1 capitalize">{room.view_type}</div>
                              )}
                            </div>
                            <div className={`w-3 h-3 rounded-full ${room.housekeeping_status === 'dirty' ? 'bg-red-300' : 'bg-white/50'}`} />
                          </div>
                          {room.current_booking ? (
                            <div className="mt-2 text-xs space-y-0.5">
                              <div className="font-medium truncate">{room.current_booking.guest_name}</div>
                              <div className="opacity-80">
                                {room.current_booking.check_in} → {room.current_booking.check_out}
                              </div>
                              <div className="opacity-60 capitalize">{room.current_booking.booking_source}</div>
                            </div>
                          ) : (
                            <div className="mt-2 text-xs opacity-60">{status.label}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Room Detail Panel — Slide-in drawer */}
      {selectedRoom && (
        <RoomDetailDrawer
          room={selectedRoom}
          onClose={() => setSelectedRoom(null)}
          onCheckIn={handleCheckIn}
          onRefresh={fetchRoomScheme}
        />
      )}

      <Footer />
    </div>
  );
}

function RoomDetailDrawer({ room, onClose, onCheckIn, onRefresh }) {
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  const booking = room.current_booking;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Room {room.room_number}</h2>
              <p className="text-sm text-muted-foreground capitalize">
                Floor {room.floor}
                {room.view_type && ` • ${room.view_type} view`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>

          {/* Status badge */}
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${(statusColors[room.status] || statusColors.available).bg} ${(statusColors[room.status] || statusColors.available).text}`}>
            {(statusColors[room.status] || statusColors.available).label}
          </div>

          {/* Housekeeping Status */}
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Home className="w-4 h-4" />
              Housekeeping
            </h3>
            <p className="text-sm text-muted-foreground capitalize">
              Status: {room.housekeeping_status}
            </p>
          </div>

          {booking ? (
            <>
              {/* Guest Info */}
              <div className="border-t border-border pt-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Current Guest
                </h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <span className="font-medium">{booking.guest_name}</span></p>
                  {booking.guest_email && (
                    <p><span className="text-muted-foreground">Email:</span> {booking.guest_email}</p>
                  )}
                  <p><span className="text-muted-foreground">Check-in:</span> {booking.check_in}</p>
                  <p><span className="text-muted-foreground">Check-out:</span> {booking.check_out}</p>
                  <p><span className="text-muted-foreground">Source:</span> <span className="capitalize">{booking.booking_source}</span></p>
                  <p><span className="text-muted-foreground">Status:</span> <span className="capitalize">{booking.booking_status}</span></p>
                  <p><span className="text-muted-foreground">Total:</span> <span className="font-bold text-primary">€{(booking.final_price || 0).toFixed(2)}</span></p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="text-sm font-semibold">Actions</h3>
                {booking.booking_status === 'confirmed' && (
                  <Button
                    className="w-full"
                    onClick={() => onCheckIn(booking.booking_id)}
                  >
                    Check In Guest
                  </Button>
                )}
                {booking.booking_status === 'checked_in' && (
                  <Button className="w-full" variant="secondary">
                    Check Out Guest
                  </Button>
                )}
                <Button className="w-full" variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Issue Invoice (Фактура)
                </Button>
                <Button className="w-full" variant="outline">
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Folio / Split Bill
                </Button>
                <Button className="w-full" variant="outline">
                  Extend / Shorten Stay
                </Button>
                <Button className="w-full" variant="outline">
                  Move Guest to Another Room
                </Button>
              </div>
            </>
          ) : (
            <div className="border-t border-border pt-4 text-center py-8">
              <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground mb-4">Room is currently unoccupied</p>
              <Button variant="outline" className="w-full">
                Create Walk-in Booking
              </Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
