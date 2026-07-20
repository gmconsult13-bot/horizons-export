import { useState } from 'react';
import pb from '@/lib/pocketbaseClient.js';

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const submitBooking = async (bookingData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Attempt to link booking to an existing guest account
      if (bookingData.guest_email && !bookingData.guest_id) {
        try {
          // 1) Collection name is exactly 'guests'
          // 2) Filter uses valid 'email' field
          const guestRes = await pb.collection('guests').getList(1, 1, {
            filter: `email="${bookingData.guest_email}"`,
            $autoCancel: false
          });
          
          if (guestRes.items && guestRes.items.length > 0) {
            bookingData.guest_id = guestRes.items[0].id;
          }
        } catch (guestErr) {
          // 4) Add error handling: catch, log to console, and allow flow to continue gracefully
          console.error('Error fetching guest data for booking link (continuing gracefully):', guestErr);
        }
      }

      const record = await pb.collection('bookings').create(bookingData, {
        $autoCancel: false
      });

      setSuccess(record);
      return record;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create booking';
      setError(errorMessage);
      console.error('Error creating booking:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setError(null);
    setSuccess(null);
  };

  return { submitBooking, loading, error, success, resetBooking };
}