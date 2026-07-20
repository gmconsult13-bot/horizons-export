/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("seasons");

  const record0 = new Record(collection);
    record0.id = "m0j1xp3huc9zpg7";
    record0.set("name", "Test Season");
    record0.set("start_date", "2026-07-01");
    record0.set("end_date", "2026-08-31");
    record0.set("pricing_multiplier", 1.0);
    record0.set("description", "Test");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  const seededRecordIds = ["m0j1xp3huc9zpg7"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("seasons", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})