/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const rooms = app.findRecordsByFilter("rooms", "id != ''");

  for (const room of rooms) {
    const currentBeds = Number(room.get("capacity_beds")) || 0;
    const currentTotal = Number(room.get("total_rooms")) || 0;

    if (currentBeds >= 1 && currentTotal >= 1) continue;

    const capacity = Number(room.get("capacity")) || 1;
    room.set("capacity_beds", Math.max(1, capacity));

    // Older seeded records contain zero in a field that later became
    // required with min=1. Keep their initial occupancy at zero.
    if (currentTotal < 1) {
      room.set("total_rooms", 1);
      room.set("available_rooms", 1);
    }

    app.save(room);
  }
}, (app) => {
  // Data repair is intentionally not reverted.
});
