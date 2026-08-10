import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Loader2, ListOrdered, Edit2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import apiServerClient from '@/lib/apiServerClient.js';

export default function RoomAllotmentsPage() {
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editTotalRooms, setEditTotalRooms] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAllotments = async () => {
    setIsLoading(true);
    try {
      const response = await apiServerClient.fetch('/room-allotments');
      if (!response.ok) throw new Error('Failed to fetch room allotments');
      const data = await response.json();
      setRooms(data.room_types || []);
    } catch (error) {
      console.error('Error fetching allotments:', error);
      toast.error('Failed to load room allotments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllotments();
  }, []);

  const handleEditClick = (room) => {
    setSelectedRoom(room);
    setEditTotalRooms(room.total_rooms.toString());
    setIsEditing(true);
  };

  const handleSaveAllotment = async () => {
    const newTotal = parseInt(editTotalRooms, 10);
    
    if (isNaN(newTotal) || newTotal < 1) {
      toast.error('Total rooms must be at least 1');
      return;
    }

    if (newTotal < selectedRoom.booked_rooms) {
      toast.error(`Cannot set total rooms below currently booked count (${selectedRoom.booked_rooms})`);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiServerClient.fetch(`/room-allotments/${selectedRoom.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_rooms: newTotal })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update room allotment');
      }

      toast.success('Room allotment updated successfully');
      setIsEditing(false);
      fetchAllotments();
    } catch (error) {
      console.error('Error updating allotment:', error);
      toast.error(error.message || 'Failed to update room allotment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getOccupancyColor = (percentage) => {
    if (percentage >= 90) return 'bg-destructive/10 text-destructive';
    if (percentage >= 70) return 'bg-warning/10 text-warning';
    return 'bg-success/10 text-success';
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Room Allotments | Admin Portal</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">Room Allotments</h1>
          <p className="text-muted-foreground mt-1">Manage total inventory and view occupancy per room type.</p>
        </div>
        <Button onClick={fetchAllotments} variant="outline" disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ListOrdered className="w-4 h-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border">
          <CardTitle>Inventory Overview</CardTitle>
          <CardDescription>Current status of all room types</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No room types found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Room Type</TableHead>
                  <TableHead className="text-right">Total Rooms</TableHead>
                  <TableHead className="text-right">Booked</TableHead>
                  <TableHead className="text-right">Available</TableHead>
                  <TableHead className="text-center">Occupancy</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="text-right">{room.total_rooms}</TableCell>
                    <TableCell className="text-right">{room.booked_rooms}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{room.available_rooms}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={getOccupancyColor(room.occupancy_percentage)}>
                        {Math.round(room.occupancy_percentage)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleEditClick(room)}
                        className="hover:bg-primary/10 hover:text-primary"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Room Allotment</DialogTitle>
            <DialogDescription>
              Update the total number of rooms available for {selectedRoom?.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="total_rooms">Total Rooms</Label>
              <Input
                id="total_rooms"
                type="number"
                min={selectedRoom?.booked_rooms || 1}
                value={editTotalRooms}
                onChange={(e) => setEditTotalRooms(e.target.value)}
              />
              {selectedRoom && (
                <p className="text-xs text-muted-foreground flex items-center mt-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Minimum allowed: {selectedRoom.booked_rooms} (currently booked)
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSaveAllotment} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}