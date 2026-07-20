import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { CalendarDays, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AddSingleDayClosureForm } from '@/components/admin/availability/AddSingleDayClosureForm.jsx';
import { AddDateRangeClosureForm } from '@/components/admin/availability/AddDateRangeClosureForm.jsx';
import { AddRecurringClosureForm } from '@/components/admin/availability/AddRecurringClosureForm.jsx';
import { ClosureRulesList } from '@/components/admin/availability/ClosureRulesList.jsx';
import { AvailabilityCalendar } from '@/components/admin/availability/AvailabilityCalendar.jsx';
import pb from '@/lib/pocketbaseClient.js';
import apiServerClient from '@/lib/apiServerClient.js';

export default function RoomAvailabilityPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [rules, setRules] = useState([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(false);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const records = await pb.collection('rooms').getFullList({
          sort: 'name',
          $autoCancel: false
        });
        setRooms(records);
        if (records.length > 0) {
          setSelectedRoomId(records[0].id);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast.error('Failed to load room types');
      } finally {
        setIsLoadingRooms(false);
      }
    };
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedRoomId) {
      fetchRules(selectedRoomId);
    }
  }, [selectedRoomId]);

  const fetchRules = async (roomId) => {
    setIsLoadingRules(true);
    try {
      const response = await apiServerClient.fetch(`/room-availability/${roomId}`);
      if (!response.ok) throw new Error('Failed to fetch availability rules');
      const data = await response.json();
      setRules(data.rules || []);
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to load availability rules');
    } finally {
      setIsLoadingRules(false);
    }
  };

  const handleRulesChanged = () => {
    fetchRules(selectedRoomId);
  };

  return (
    <div className="space-y-6 pb-12">
      <Helmet>
        <title>Room Availability | Admin Portal</title>
      </Helmet>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif text-foreground tracking-tight">Room Availability</h1>
          <p className="text-muted-foreground mt-1">Manage dates when room types are closed for booking.</p>
        </div>
        <CalendarDays className="w-8 h-8 text-primary/40" />
      </div>

      {isLoadingRooms ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No room types found. Please create rooms first.
        </div>
      ) : (
        <Tabs value={selectedRoomId} onValueChange={setSelectedRoomId} className="space-y-6">
          <TabsList className="bg-card border w-full flex-wrap h-auto justify-start p-1">
            {rooms.map((room) => (
              <TabsTrigger key={room.id} value={room.id} className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                {room.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedRoomId} className="space-y-6 outline-none">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Forms */}
              <div className="xl:col-span-1 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Closure Rule</CardTitle>
                    <CardDescription>Block dates for {rooms.find(r => r.id === selectedRoomId)?.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="single" className="w-full">
                      <TabsList className="grid w-full grid-cols-3 mb-4">
                        <TabsTrigger value="single">Single</TabsTrigger>
                        <TabsTrigger value="range">Range</TabsTrigger>
                        <TabsTrigger value="recurring">Weekly</TabsTrigger>
                      </TabsList>
                      <TabsContent value="single">
                        <AddSingleDayClosureForm roomTypeId={selectedRoomId} onRuleAdded={handleRulesChanged} />
                      </TabsContent>
                      <TabsContent value="range">
                        <AddDateRangeClosureForm roomTypeId={selectedRoomId} onRuleAdded={handleRulesChanged} />
                      </TabsContent>
                      <TabsContent value="recurring">
                        <AddRecurringClosureForm roomTypeId={selectedRoomId} onRuleAdded={handleRulesChanged} />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Legend */}
                <Card className="bg-muted/30">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-sm">Calendar Legend</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[hsl(var(--calendar-closed))]"></div>
                        <span>Explicitly Closed (Dates/Ranges)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-[hsl(var(--calendar-recurring))]"></div>
                        <span>Recurring Closure (Weekly)</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Calendar and Rule List */}
              <div className="xl:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Availability Calendar</CardTitle>
                    <CardDescription>90-day overview of blockouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRules ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : (
                      <div className="overflow-x-auto pb-4">
                        <AvailabilityCalendar rules={rules} />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Active Rules</CardTitle>
                    <CardDescription>Manage configured blockouts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingRules ? (
                      <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                    ) : (
                      <ClosureRulesList rules={rules} onRulesChanged={handleRulesChanged} />
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}