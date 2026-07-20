/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  const record0 = new Record(collection);
    record0.id = "jdqi8vrgaycp8tu";
    record0.set("name", "Economy Room");
    record0.set("description", "Simple, modest hotel room with basic bed and furniture");
    record0.set("amenities", "Basic amenities, comfortable bed, private bathroom");
    record0.set("price", 89.99);
    record0.set("capacity", 2);
    record0.set("seasonal_pricing", null);
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    record1.id = "92v6p50tz4jgr7m";
    record1.set("name", "Double Deluxe");
    record1.set("description", "Spacious, upscale hotel room with premium furnishings and better decor");
    record1.set("amenities", "Premium bedding, flat-screen TV, mini bar, work desk, luxury bathroom");
    record1.set("price", 149.99);
    record1.set("capacity", 2);
    record1.set("seasonal_pricing", null);
  try {
    app.save(record1);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record2 = new Record(collection);
    record2.id = "yk8wiqyrx1k5xew";
    record2.set("name", "Luxury Suite");
    record2.set("description", "Premium, high-end suite with elegant furnishings and luxury amenities");
    record2.set("amenities", "King bed, separate living area, premium toiletries, concierge service, city view");
    record2.set("price", 249.99);
    record2.set("capacity", 4);
    record2.set("seasonal_pricing", null);
  try {
    app.save(record2);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  const seededRecordIds = ["yk8wiqyrx1k5xew", "92v6p50tz4jgr7m", "jdqi8vrgaycp8tu"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("rooms", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})