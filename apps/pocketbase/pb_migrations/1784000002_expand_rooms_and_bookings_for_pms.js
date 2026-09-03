/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Expand rooms collection with PMS fields
  const rooms = app.findCollectionByNameOrId("rooms");

  const newRoomFields = [
    { name: "room_number", type: "text" },
    { name: "floor", type: "number", onlyInt: true },
    { name: "room_type_id", type: "text" },
    { name: "view_type", type: "text" },
    { name: "room_status", type: "text" },
    { name: "housekeeping_status", type: "text" },
    { name: "position_x", type: "number" },
    { name: "position_y", type: "number" },
  ];

  for (const f of newRoomFields) {
    if (!rooms.fields.getByName(f.name)) {
      if (f.type === "text") {
        rooms.fields.add(new TextField({ name: f.name, required: false }));
      } else if (f.type === "number") {
        rooms.fields.add(new NumberField({ name: f.name, required: false, onlyInt: f.onlyInt || false }));
      }
    }
  }

  app.save(rooms);

  // Expand bookings collection with PMS fields
  const bookings = app.findCollectionByNameOrId("bookings");

  const newBookingFields = [
    { name: "booking_source", type: "text" },
    { name: "booking_status", type: "text" },
    { name: "assigned_room_id", type: "text" },
    { name: "channel_booking_id", type: "text" },
    { name: "channel_name", type: "text" },
    { name: "num_folios", type: "number", onlyInt: true },
    { name: "check_in_time", type: "date" },
    { name: "check_out_time", type: "date" },
    { name: "notes", type: "text" },
    { name: "color", type: "text" },
  ];

  for (const f of newBookingFields) {
    if (!bookings.fields.getByName(f.name)) {
      if (f.type === "text") {
        bookings.fields.add(new TextField({ name: f.name, required: false }));
      } else if (f.type === "number") {
        bookings.fields.add(new NumberField({ name: f.name, required: false, onlyInt: f.onlyInt || false }));
      } else if (f.type === "date") {
        bookings.fields.add(new DateField({ name: f.name, required: false }));
      }
    }
  }

  app.save(bookings);
}, (app) => {
  // Revert: remove added fields
  const collections = ["rooms", "bookings"];
  const fieldsToRemove = {
    rooms: ["room_number", "floor", "room_type_id", "view_type", "room_status", "housekeeping_status", "position_x", "position_y"],
    bookings: ["booking_source", "booking_status", "assigned_room_id", "channel_booking_id", "channel_name", "num_folios", "check_in_time", "check_out_time", "notes", "color"],
  };

  for (const colName of collections) {
    try {
      let col = app.findCollectionByNameOrId(colName);
      for (const fName of fieldsToRemove[colName]) {
        try {
          col.fields.removeByName(fName);
        } catch (e) {
          // field doesn't exist, skip
        }
      }
      app.save(col);
    } catch (e) {
      if (e.message.includes("no rows in result set")) continue;
      throw e;
    }
  }
})
