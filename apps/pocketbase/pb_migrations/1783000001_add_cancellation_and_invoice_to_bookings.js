/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("bookings");

  const fieldsToAdd = [
    { name: "cancellation_policy", field: new TextField({ name: "cancellation_policy", required: false }), type: "text" },
    { name: "invoice_number", field: new TextField({ name: "invoice_number", required: false }), type: "text" },
    { name: "invoice_issued", field: new BoolField({ name: "invoice_issued", required: false }), type: "bool" },
    { name: "invoice_data", field: new JsonField({ name: "invoice_data", required: false }), type: "json" },
    { name: "refund_status", field: new TextField({ name: "refund_status", required: false }), type: "text" },
    { name: "refund_amount", field: new NumberField({ name: "refund_amount", required: false }), type: "number" },
    { name: "payment_method", field: new TextField({ name: "payment_method", required: false }), type: "text" }
  ];

  for (const item of fieldsToAdd) {
    const existing = collection.fields.getByName(item.name);
    if (existing) {
      if (existing.type !== item.type) {
        collection.fields.removeByName(item.name);
        collection.fields.add(item.field);
      }
    } else {
      collection.fields.add(item.field);
    }
  }

  return app.save(collection);
}, (app) => {
  try {
    const collection = app.findCollectionByNameOrId("bookings");
    collection.fields.removeByName("cancellation_policy");
    collection.fields.removeByName("invoice_number");
    collection.fields.removeByName("invoice_issued");
    collection.fields.removeByName("invoice_data");
    collection.fields.removeByName("refund_status");
    collection.fields.removeByName("refund_amount");
    collection.fields.removeByName("payment_method");
    return app.save(collection);
  } catch (e) {
    if (e.message && e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
});
