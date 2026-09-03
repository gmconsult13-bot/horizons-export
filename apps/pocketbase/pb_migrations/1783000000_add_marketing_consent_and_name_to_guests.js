/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("guests");

  const existingName = collection.fields.getByName("name");
  if (existingName) {
    if (existingName.type !== "text") {
      collection.fields.removeByName("name");
      collection.fields.add(new TextField({
        name: "name",
        required: false
      }));
    }
  } else {
    collection.fields.add(new TextField({
      name: "name",
      required: false
    }));
  }

  const existingConsent = collection.fields.getByName("marketing_consent");
  if (existingConsent) {
    if (existingConsent.type !== "bool") {
      collection.fields.removeByName("marketing_consent");
      collection.fields.add(new BoolField({
        name: "marketing_consent",
        required: false
      }));
    }
  } else {
    collection.fields.add(new BoolField({
      name: "marketing_consent",
      required: false
    }));
  }

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("guests");
    collection.fields.removeByName("name");
    collection.fields.removeByName("marketing_consent");
    return app.save(collection);
  } catch (e) {
    if (e.message && e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
});
