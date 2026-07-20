import { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        setError(null);
        const records = await pb.collection('rooms').getFullList({
          sort: 'price',
          $autoCancel: false
        });
        // Filter out Apartment and Presidential Suite room types
        const filteredRecords = records.filter(
          room => !room.name?.toLowerCase().includes('apartment') &&
                  !room.name?.toLowerCase().includes('presidential suite')
        );
        setRooms(filteredRecords);
      } catch (err) {
        setError(err.message || 'Failed to load rooms');
        console.error('Error fetching rooms:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  return { rooms, loading, error };
}