/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("rooms");

  const record0 = new Record(collection);
    record0.id = "k1ckb4qephizt8e";
    record0.set("name", "Economy Room");
    record0.set("description", "Cozy and comfortable room perfect for budget-conscious travelers. Features a queen bed, basic amenities, and a private bathroom.");
    record0.set("price", 80);
    record0.set("capacity", 2);
    record0.set("amenities", "WiFi, Air Conditioning, Private Bathroom, Basic Toiletries");
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
    record1.id = "0hjx3e1cltrll2h";
    record1.set("name", "Double Deluxe");
    record1.set("description", "Spacious room with modern furnishings and enhanced comfort. Includes a king bed, work desk, and premium amenities for a relaxing stay.");
    record1.set("price", 150);
    record1.set("capacity", 2);
    record1.set("amenities", "WiFi, Air Conditioning, Premium Bedding, Work Desk, Flat-screen TV, Mini Bar, Luxury Toiletries");
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
    record2.id = "8rzyr9qq6z345ux";
    record2.set("name", "Luxury Suite");
    record2.set("description", "Our premium offering featuring a separate living area, bedroom with king bed, and stunning views. Perfect for families or those seeking ultimate comfort.");
    record2.set("price", 250);
    record2.set("capacity", 4);
    record2.set("amenities", "WiFi, Air Conditioning, Premium Bedding, Living Area, Work Desk, Flat-screen TV, Mini Bar, Luxury Toiletries, Bathrobe & Slippers, Complimentary Breakfast");
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
  const seededRecordIds = ["8rzyr9qq6z345ux", "0hjx3e1cltrll2h", "k1ckb4qephizt8e"];
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