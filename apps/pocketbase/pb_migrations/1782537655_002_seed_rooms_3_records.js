/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  const record0 = new Record(collection);
    record0.id = "aqsx7uivwzy4ahk";
    record0.set("name", "Deluxe Suite");
    record0.set("description", "Spacious suite with king bed, marble bathroom, city view");
    record0.set("amenities", "King Bed, Marble Bathroom, City View, Premium Toiletries, Complimentary WiFi, 24-Hour Room Service");
    record0.set("price", 250);
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
    record1.id = "bteten2iy06shno";
    record1.set("name", "Standard Room");
    record1.set("description", "Comfortable room with queen bed and modern amenities");
    record1.set("amenities", "Queen Bed, Modern Bathroom, Work Desk, Flat-screen TV, Complimentary WiFi, Air Conditioning");
    record1.set("price", 150);
    record1.set("capacity", 2);
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
    record2.id = "dw1tah1nf0c1oi3";
    record2.set("name", "Presidential Suite");
    record2.set("description", "Ultimate luxury with separate living area, premium furnishings, and exclusive amenities");
    record2.set("amenities", "King Bed, Separate Living Area, Marble Bathroom with Jacuzzi, Premium Minibar, Concierge Service, Complimentary WiFi, Premium Toiletries");
    record2.set("price", 450);
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
  const seededRecordIds = ["dw1tah1nf0c1oi3", "bteten2iy06shno", "aqsx7uivwzy4ahk"];
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