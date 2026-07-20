/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const roomType = e.record.get("room_type");
  const numberOfGuests = e.record.get("number_of_guests");
  
  console.log(`[BOOKING CREATED] Booking ID: ${e.record.id}, Room Type: ${roomType}, Guests: ${numberOfGuests}`);
  
  try {
    // Fetch the room record
    const room = $app.dao().findRecordById("rooms", roomType);
    
    if (!room) {
      console.log(`[ERROR] Room type '${roomType}' not found`);
      throw new BadRequestError(`Room type '${roomType}' not found`);
    }
    
    const currentAvailable = room.get("available_rooms");
    const newAvailable = currentAvailable - numberOfGuests;
    
    console.log(`[ROOM UPDATE] Room: ${roomType}, Current Available: ${currentAvailable}, Guests: ${numberOfGuests}, New Available: ${newAvailable}`);
    
    // Validate availability
    if (newAvailable < 0) {
      console.log(`[VALIDATION FAILED] Not enough rooms available. Required: ${numberOfGuests}, Available: ${currentAvailable}`);
      throw new BadRequestError("Not enough rooms available");
    }
    
    // Update room availability
    room.set("available_rooms", newAvailable);
    $app.dao().saveRecord(room);
    
    console.log(`[SUCCESS] Room '${roomType}' availability updated to ${newAvailable}`);
  } catch (error) {
    console.log(`[EXCEPTION] Error updating room availability: ${error.message}`);
    throw error;
  }
  
  e.next();
}, "bookings");