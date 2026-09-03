/// <reference path="../pb_data/types.d.ts" />

// Bulgarian invoice (фактура) storage. One invoice per paid booking,
// generated automatically when a booking's payment completes. Records are
// immutable snapshots (seller details are copied in at generation time) so
// they remain legally valid even if other settings change later.
migrate((app) => {
  const bookingsCollection = app.findCollectionByNameOrId("bookings");

  const collection = new Collection({
    // Only hooks/superuser create invoices — never from the public API.
    "createRule": null,
    // Invoices are immutable legal documents.
    "updateRule": null,
    "deleteRule": "@request.auth.role = 'admin'",
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text5819302746",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "hidden": false,
        "id": "text2947103856",
        "name": "invoice_number",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 10,
        "min": 10,
        "pattern": "^[0-9]{10}$"
      },
      {
        "hidden": false,
        "id": "date3918407562",
        "name": "issue_date",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "date",
        "max": "",
        "min": ""
      },
      {
        "hidden": false,
        "id": "date5948203716",
        "name": "tax_event_date",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "date",
        "max": "",
        "min": ""
      },
      {
        "hidden": false,
        "id": "relation6829401537",
        "name": "booking",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "relation",
        "cascadeDelete": false,
        "collectionId": bookingsCollection.id,
        "displayFields": [],
        "maxSelect": 1,
        "minSelect": 0
      },
      {
        "hidden": false,
        "id": "text1847392650",
        "name": "guest_name",
        "presentable": true,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text7392840165",
        "name": "guest_address",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text9382017465",
        "name": "guest_identifier",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text3847201956",
        "name": "guest_country",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text4910285736",
        "name": "seller_name",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text2938471056",
        "name": "seller_address",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text1029384756",
        "name": "seller_eik",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text5839201746",
        "name": "seller_vat_number",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text1928374650",
        "name": "seller_mol",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text6483920157",
        "name": "description",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "number5819302746",
        "name": "net_amount",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "hidden": false,
        "id": "number2947103856",
        "name": "vat_rate",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "hidden": false,
        "id": "number3918407562",
        "name": "vat_amount",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "hidden": false,
        "id": "number5948203716",
        "name": "total_amount",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "number",
        "min": 0
      },
      {
        "hidden": false,
        "id": "text6829401537",
        "name": "currency",
        "presentable": false,
        "primaryKey": false,
        "required": true,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 3,
        "min": 3,
        "pattern": "^[A-Z]{3}$"
      },
      {
        "hidden": false,
        "id": "text1847392650",
        "name": "payment_method",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "text7392840165",
        "name": "original_copy",
        "presentable": false,
        "primaryKey": false,
        "required": false,
        "system": false,
        "type": "text",
        "autogeneratePattern": "",
        "max": 0,
        "min": 0,
        "pattern": ""
      },
      {
        "hidden": false,
        "id": "autodate5839201746",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      },
      {
        "hidden": false,
        "id": "autodate1928374650",
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2947301859",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_invoices_invoice_number` ON `invoices` (`invoice_number`)"
    ],
    "listRule": "(@request.auth.id != '' && booking.guest_id = @request.auth.id) || @request.auth.role = 'admin'",
    "name": "invoices",
    "system": false,
    "type": "base",
    "viewRule": "(@request.auth.id != '' && booking.guest_id = @request.auth.id) || @request.auth.role = 'admin'"
  });

  return app.save(collection);
}, (app) => {
  try {
    return app.delete(app.findCollectionByNameOrId("pbc_2947301859"));
  } catch (error) {
    if (error.message.includes("no rows in result set")) return;
    throw error;
  }
});
