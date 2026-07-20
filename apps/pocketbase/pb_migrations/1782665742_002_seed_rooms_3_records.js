/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  const record0 = new Record(collection);
    record0.id = "g5dbkjps0buxm1c";
    record0.set("name", "Economy Room");
    record0.set("description", "Comfortable and affordable room with essential amenities");
    record0.set("amenities", "WiFi, Air Conditioning, Private Bathroom");
    record0.set("price", 80);
    record0.set("capacity", 2);
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
    record1.id = "f64tt9rsfzfu772";
    record1.set("name", "Double Deluxe");
    record1.set("description", "Spacious room with premium furnishings and modern conveniences");
    record1.set("amenities", "WiFi, Air Conditioning, Private Bathroom, Flat-screen TV, Mini Bar");
    record1.set("price", 150);
    record1.set("capacity", 3);
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
    record2.id = "j1094rha2ib7jcb";
    record2.set("name", "Luxury Suite");
    record2.set("description", "Exclusive suite with premium amenities and personalized service");
    record2.set("amenities", "WiFi, Air Conditioning, Private Bathroom, Flat-screen TV, Mini Bar, Jacuzzi, Lounge Area");
    record2.set("price", 250);
    record2.set("capacity", 4);
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
  const seededRecordIds = ["j1094rha2ib7jcb", "f64tt9rsfzfu772", "g5dbkjps0buxm1c"];
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