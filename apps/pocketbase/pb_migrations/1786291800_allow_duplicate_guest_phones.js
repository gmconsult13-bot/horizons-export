/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  const guests = app.findCollectionByNameOrId("guests");

  guests.indexes = (guests.indexes || []).filter((index) => {
    const normalizedIndex = String(index).toLowerCase();
    return !(
      normalizedIndex.includes("unique") &&
      normalizedIndex.includes("phone")
    );
  });

  app.save(guests);
}, (app) => {
  // Duplicate phone numbers remain allowed when rolling back.
});
