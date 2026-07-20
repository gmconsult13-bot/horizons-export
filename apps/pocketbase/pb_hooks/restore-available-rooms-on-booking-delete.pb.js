/// <reference path="../pb_data/types.d.ts" />
onRecordAfterDeleteSuccess((e) => {
  const roomType = e.record.get("room_type");
  const numberOfGuests = e.record.get("number_of_guests");
  
  console.log(`[BOOKING DELETED] Booking ID: ${e.record.id}, Room Type: ${roomType}, Guests: ${numberOfGuests}`);
  
  try {
    // Fetch the room record
    const room = $app.dao().findRecordById("rooms", roomType);
    
    if (!room) {
      console.log(`[ERROR] Room type '${roomType}' not found`);
      throw new BadRequestError(`Room type '${roomType}' not found`);
    }
    
    const currentAvailable = room.get("available_rooms");
    const totalRooms = room.get("total_rooms");
    let newAvailable = currentAvailable + numberOfGuests;
    
    console.log(`[ROOM RESTORE] Room: ${roomType}, Current Available: ${currentAvailable}, Guests Returning: ${numberOfGuests}, Calculated Available: ${newAvailable}`);
    
    // Cap at total_rooms to prevent overshooting
    if (newAvailable > totalRooms) {
      console.log(`[CAP APPLIED] Available rooms (${newAvailable}) exceeds total (${totalRooms}), capping at ${totalRooms}`);
      newAvailable = totalRooms;
    }
    
    // Update room availability
    room.set("available_rooms", newAvailable);
    $app.dao().saveRecord(room);
    
    console.log(`[SUCCESS] Room '${roomType}' availability restored to ${newAvailable}`);
  } catch (error) {
    console.log(`[EXCEPTION] Error restoring room availability: ${error.message}`);
    throw error;
  }
  
  e.next();
}, "bookings");