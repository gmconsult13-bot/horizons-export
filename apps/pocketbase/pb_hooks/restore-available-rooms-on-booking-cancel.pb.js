/// <reference path="../pb_data/types.d.ts" />
// Restores room availability when a booking is cancelled (booking_status
// changes to "cancelled"). Cancellations are updates, not deletes, so the
// on-delete hook does not fire — this hook covers the new cancel flow.
onRecordAfterUpdateSuccess((e) => {
  const original = e.record.original();
  const wasCancelled = original.get("booking_status");
  const isCancelled = e.record.get("booking_status");

  if (isCancelled !== "cancelled" || wasCancelled === "cancelled") {
    // Not a new cancellation — nothing to do.
    e.next();
    return;
  }

  const roomType = e.record.get("room_type");
  const numberOfGuests = e.record.get("number_of_guests");

  console.log(`[BOOKING CANCELLED] Booking ID: ${e.record.id}, Room Type: ${roomType}, Guests: ${numberOfGuests}`);

  try {
    const room = $app.dao().findRecordById("rooms", roomType);

    if (!room) {
      console.log(`[ERROR] Room type '${roomType}' not found; skipping availability restore`);
      e.next();
      return;
    }

    const currentAvailable = room.get("available_rooms");
    const totalRooms = room.get("total_rooms");
    let newAvailable = currentAvailable + numberOfGuests;

    // Cap at total_rooms to prevent overshooting
    if (newAvailable > totalRooms) {
      console.log(`[CAP APPLIED] Available rooms (${newAvailable}) exceeds total (${totalRooms}), capping at ${totalRooms}`);
      newAvailable = totalRooms;
    }

    room.set("available_rooms", newAvailable);
    $app.dao().saveRecord(room);

    console.log(`[SUCCESS] Room '${roomType}' availability restored to ${newAvailable} after cancellation`);
  } catch (error) {
    // Never fail the cancellation itself because of an availability issue.
    console.log(`[EXCEPTION] Error restoring room availability on cancel: ${error.message}`);
  }

  e.next();
}, "bookings");
