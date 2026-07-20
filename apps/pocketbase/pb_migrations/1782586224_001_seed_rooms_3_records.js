/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  const record0 = new Record(collection);
    record0.id = "qy8vbqc2lzt9xhe";
    record0.set("name", "Economy Room");
    record0.set("description", "Modern minimalist design with wooden accents, fern botanical pattern bedding, warm ambient lighting with black metal fixtures, large windows with views, comfortable seating area, and air conditioning");
    record0.set("price", 99);
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
    record1.id = "idet9ag494rmrtr";
    record1.set("name", "Double Deluxe");
    record1.set("description", "Spacious luxury bedroom with wooden headboard, fern botanical pattern bedding, contemporary wall art with gold and green tones, large architectural windows with nature views, beige armchair, smart TV, and modern amenities");
    record1.set("price", 199);
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
    record2.id = "qtm2o9z0ic7enwt";
    record2.set("name", "Apartment");
    record2.set("description", "Premium spacious accommodation with contemporary luxury design, wooden accents, fern botanical bedding, gold and green abstract wall art, large windows with nature views, comfortable seating, smart TV, and full modern amenities including air conditioning");
    record2.set("price", 299);
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
  const seededRecordIds = ["qtm2o9z0ic7enwt", "idet9ag494rmrtr", "qy8vbqc2lzt9xhe"];
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