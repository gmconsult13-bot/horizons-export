/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const rooms = app.findRecordsByFilter("rooms", "id != ''");

  for (const room of rooms) {
    const currentBeds = Number(room.get("capacity_beds")) || 0;

    if (currentBeds >= 1) continue;

    const capacity = Number(room.get("capacity")) || 1;
    room.set("capacity_beds", Math.max(1, capacity));
    app.save(room);
  }
}, (app) => {
  // Data repair is intentionally not reverted.
});
