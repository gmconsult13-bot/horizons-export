/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");
  const existingRooms = app.findRecordsByFilter("rooms", "id != ''");

  if (existingRooms.length > 0) return;

  const roomTypes = [
    {
      id: "economyroom0001",
      name: "Economy Room",
      price: 0,
      capacity: 2,
      capacity_beds: 2,
      capacity_extra_beds: 0,
      total_rooms: 3,
      available_rooms: 3,
    },
    {
      id: "doubledeluxe001",
      name: "Double Deluxe",
      price: 0,
      capacity: 2,
      capacity_beds: 2,
      capacity_extra_beds: 1,
      total_rooms: 17,
      available_rooms: 17,
    },
    {
      id: "luxurysuite0001",
      name: "Luxury Suite",
      price: 0,
      capacity: 4,
      capacity_beds: 4,
      capacity_extra_beds: 1,
      total_rooms: 1,
      available_rooms: 1,
    },
  ];

  for (const roomType of roomTypes) {
    const record = new Record(collection);
    record.id = roomType.id;

    for (const [field, value] of Object.entries(roomType)) {
      if (field !== "id") record.set(field, value);
    }

    app.save(record);
  }
}, (app) => {
  for (const id of [
    "economyroom0001",
    "doubledeluxe001",
    "luxurysuite0001",
  ]) {
    try {
      app.delete(app.findRecordById("rooms", id));
    } catch (error) {
      if (!error.message.includes("no rows in result set")) throw error;
    }
  }
});
