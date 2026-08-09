/// <reference path="../pb_data/types.d.ts" />

const adminRule =
  "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.is_admin = true)";

migrate((app) => {
  const fullyManagedCollections = [
    "rooms",
    "seasons",
    "prices",
    "children_surcharges",
    "dining",
    "gallery",
    "guest_deals",
    "room_availability_rules",
  ];

  for (const collectionName of fullyManagedCollections) {
    const collection = app.findCollectionByNameOrId(collectionName);
    collection.createRule = adminRule;
    collection.updateRule = adminRule;
    collection.deleteRule = adminRule;
    app.save(collection);
  }

  // Guests may create bookings and reviews, but only administrators may
  // alter or remove them from the management portal.
  for (const collectionName of ["bookings", "guest_reviews"]) {
    const collection = app.findCollectionByNameOrId(collectionName);
    collection.updateRule = adminRule;
    collection.deleteRule = adminRule;
    app.save(collection);
  }

  const guests = app.findCollectionByNameOrId("guests");
  guests.listRule = adminRule;
  guests.viewRule =
    `(${adminRule}) || id = @request.auth.id || email = @request.auth.email`;
  guests.updateRule =
    `(${adminRule}) || id = @request.auth.id || email = @request.auth.email`;
  guests.deleteRule =
    `(${adminRule}) || id = @request.auth.id || email = @request.auth.email`;
  app.save(guests);
}, (app) => {
  // Access normalization is intentionally not reverted automatically.
});
