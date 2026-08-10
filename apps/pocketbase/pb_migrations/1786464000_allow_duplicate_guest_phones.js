/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const guests = app.findCollectionByNameOrId("guests");

  // Email remains unique because `guests` is an auth collection. Phone numbers
  // intentionally are not unique: families may legitimately share one number.
  guests.indexes = (guests.indexes || []).filter((index) => {
    const normalizedIndex = String(index).toLowerCase();
    return !(normalizedIndex.includes("unique") && normalizedIndex.includes("phone"));
  });

  app.save(guests);
}, (app) => {
  // Keep duplicate phone numbers allowed on rollback to avoid invalidating data.
});
