/// <reference path="../pb_data/types.d.ts" />
// Fixes (2026-09-06 live testing): mirrors update-available-rooms-on-booking.pb.js
//  - Look the room up by NAME (room_type holds the room name, not an id).
//  - One booking = one room (previously it restored number_of_guests).
//  - Uses the PocketBase 0.38 API ($app.* — $app.dao() was removed).
//  - Never throw from the delete flow — the record is already gone.
onRecordAfterDeleteSuccess((e) => {
  const roomType = e.record.get("room_type");

  try {
    const room = $app.findFirstRecordByFilter(
      "rooms",
      "name = {:name}",
      { name: roomType }
    );

    const currentAvailable = room.get("available_rooms");
    const totalRooms = room.get("total_rooms");
    let newAvailable = currentAvailable + 1;

    // Cap at total_rooms to prevent overshooting
    if (newAvailable > totalRooms) {
      newAvailable = totalRooms;
    }

    room.set("available_rooms", newAvailable);
    $app.save(room);

    $app.logger().info(
      "Room availability restored after booking deletion",
      "room", roomType,
      "available", newAvailable,
      "booking", e.record.id
    );
  } catch (err) {
    $app.logger().error(
      "Failed to restore room availability after booking deletion",
      "error", "" + err,
      "room", roomType,
      "booking", e.record.id
    );
  }

  e.next();
}, "bookings");
