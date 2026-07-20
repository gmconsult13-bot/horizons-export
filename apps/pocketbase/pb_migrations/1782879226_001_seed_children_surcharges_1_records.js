/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("children_surcharges");

  const record0 = new Record(collection);
    record0.id = "m546mpl1fu8b0gu";
    record0.set("min_age", 0.01);
    record0.set("max_age", 2);
    record0.set("surcharge_amount", 0.01);
    record0.set("description", "Age 0-2 years");
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
  const seededRecordIds = ["m546mpl1fu8b0gu"];
  for (const seededRecordId of seededRecordIds) {
    try {
      app.delete(app.findRecordById("children_surcharges", seededRecordId));
    } catch (error) {
      if (error.message.includes("no rows in result set")) {
        continue;
      }
      throw error;
    }
  }
})