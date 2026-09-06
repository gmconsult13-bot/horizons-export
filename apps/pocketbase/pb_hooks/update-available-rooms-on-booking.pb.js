/// <reference path="../pb_data/types.d.ts" />
// Fixes (2026-09-06 live testing):
//  - The old hook looked up the room with findRecordById("rooms", room_type),
//    but room_type holds the room NAME (e.g. "Double Deluxe"), not the record id.
//  - It used $app.dao(), which no longer exists in PocketBase 0.38 — the hook
//    threw on EVERY booking create (after the booking was saved), making the
//    API return a 400 error to the guest even though the booking persisted.
//  - It decremented available_rooms by number_of_guests (people), not rooms.
//    One booking = one room.
//  - Availability bookkeeping must never fail the booking create itself; it is
//    logged instead so real problems are visible in the server logs.
onRecordAfterCreateSuccess((e) => {
  const roomType = e.record.get("room_type");

  try {
    // Look the room up by name (room_type stores the room name, not an id).
    const room = $app.findFirstRecordByFilter(
      "rooms",
      "name = {:name}",
      { name: roomType }
    );

    const currentAvailable = room.get("available_rooms");
    const newAvailable = currentAvailable - 1;

    if (newAvailable < 0) {
      // Do not throw: the booking is already saved and confirmed. Log loudly so
      // overbooking is visible in the logs / admin panel instead.
      $app.logger().error(
        "Overbooking warning: room is over capacity",
        "room", roomType,
        "available", currentAvailable
      );
      e.next();
      return;
    }

    room.set("available_rooms", newAvailable);
    $app.save(room);

    $app.logger().info(
      "Room availability updated after booking",
      "room", roomType,
      "available", newAvailable,
      "booking", e.record.id
    );
  } catch (err) {
    // Never fail the create — the booking is already persisted.
    $app.logger().error(
      "Failed to update room availability after booking",
      "error", "" + err,
      "room", roomType,
      "booking", e.record.id
    );
  }

  e.next();
}, "bookings");
