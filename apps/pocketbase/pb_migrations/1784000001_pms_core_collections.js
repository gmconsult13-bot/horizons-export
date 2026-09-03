/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Create room_types collection
  let roomTypes = new Collection({
    name: "room_types",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        presentable: true,
      },
      {
        name: "description",
        type: "text",
        required: false,
      },
      {
        name: "base_capacity",
        type: "number",
        required: true,
        min: 1,
        max: 20,
        onlyInt: true,
      },
      {
        name: "base_beds",
        type: "number",
        required: false,
        min: 0,
        max: 10,
        onlyInt: true,
      },
      {
        name: "extra_beds_allowed",
        type: "number",
        required: false,
        min: 0,
        max: 5,
        onlyInt: true,
      },
      {
        name: "base_price",
        type: "number",
        required: false,
        min: 0,
      },
      {
        name: "amenities",
        type: "text",
        required: false,
      },
      {
        name: "image",
        type: "file",
        required: false,
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      },
      {
        name: "sort_order",
        type: "number",
        required: false,
        onlyInt: true,
      },
    ],
  });

  try {
    app.save(roomTypes);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("room_types already exists, skipping");
  }

  // Create payment_methods collection
  let paymentMethods = new Collection({
    name: "payment_methods",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        presentable: true,
      },
      {
        name: "type",
        type: "text",
        required: true,
      },
      {
        name: "is_active",
        type: "bool",
        required: false,
      },
      {
        name: "icon",
        type: "text",
        required: false,
      },
      {
        name: "sort_order",
        type: "number",
        required: false,
        onlyInt: true,
      },
    ],
  });

  try {
    app.save(paymentMethods);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("payment_methods already exists, skipping");
  }

  // Create folios collection
  let folios = new Collection({
    name: "folios",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "booking_id",
        type: "text",
        required: true,
      },
      {
        name: "folio_type",
        type: "text",
        required: true,
      },
      {
        name: "name",
        type: "text",
        required: false,
        presentable: true,
      },
      {
        name: "email",
        type: "email",
        required: false,
      },
      {
        name: "total_charges",
        type: "number",
        required: false,
        min: 0,
      },
      {
        name: "total_payments",
        type: "number",
        required: false,
        min: 0,
      },
      {
        name: "balance",
        type: "number",
        required: false,
      },
      {
        name: "status",
        type: "text",
        required: false,
      },
      {
        name: "closed_at",
        type: "date",
        required: false,
      },
    ],
  });

  try {
    app.save(folios);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("folios already exists, skipping");
  }

  // Create charges collection
  let charges = new Collection({
    name: "charges",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "folio_id",
        type: "text",
        required: true,
      },
      {
        name: "booking_id",
        type: "text",
        required: false,
      },
      {
        name: "description",
        type: "text",
        required: true,
        presentable: true,
      },
      {
        name: "amount",
        type: "number",
        required: true,
      },
      {
        name: "charge_type",
        type: "text",
        required: false,
      },
      {
        name: "charge_date",
        type: "date",
        required: false,
      },
      {
        name: "quantity",
        type: "number",
        required: false,
        onlyInt: true,
      },
      {
        name: "unit_price",
        type: "number",
        required: false,
      },
      {
        name: "posted_automatically",
        type: "bool",
        required: false,
      },
    ],
  });

  try {
    app.save(charges);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("charges already exists, skipping");
  }

  // Create payments collection
  let payments = new Collection({
    name: "payments",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "folio_id",
        type: "text",
        required: true,
      },
      {
        name: "booking_id",
        type: "text",
        required: false,
      },
      {
        name: "amount",
        type: "number",
        required: true,
      },
      {
        name: "payment_method",
        type: "text",
        required: true,
      },
      {
        name: "payment_method_id",
        type: "text",
        required: false,
      },
      {
        name: "payment_date",
        type: "date",
        required: false,
      },
      {
        name: "reference",
        type: "text",
        required: false,
      },
      {
        name: "status",
        type: "text",
        required: false,
      },
      {
        name: "processed_by",
        type: "text",
        required: false,
      },
    ],
  });

  try {
    app.save(payments);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("payments already exists, skipping");
  }

  // Create invoices collection
  let invoices = new Collection({
    name: "invoices",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "invoice_number",
        type: "text",
        required: true,
        presentable: true,
      },
      {
        name: "invoice_type",
        type: "text",
        required: false,
      },
      {
        name: "booking_id",
        type: "text",
        required: false,
      },
      {
        name: "folio_id",
        type: "text",
        required: false,
      },
      {
        name: "guest_name",
        type: "text",
        required: true,
      },
      {
        name: "guest_egn",
        type: "text",
        required: false,
      },
      {
        name: "guest_eik",
        type: "text",
        required: false,
      },
      {
        name: "guest_address",
        type: "text",
        required: false,
      },
      {
        name: "guest_vat_number",
        type: "text",
        required: false,
      },
      {
        name: "guest_is_company",
        type: "bool",
        required: false,
      },
      {
        name: "invoice_date",
        type: "date",
        required: true,
      },
      {
        name: "due_date",
        type: "date",
        required: false,
      },
      {
        name: "service_from",
        type: "date",
        required: false,
      },
      {
        name: "service_to",
        type: "date",
        required: false,
      },
      {
        name: "items_json",
        type: "json",
        required: false,
      },
      {
        name: "subtotal",
        type: "number",
        required: false,
      },
      {
        name: "vat_rate",
        type: "number",
        required: false,
      },
      {
        name: "vat_amount",
        type: "number",
        required: false,
      },
      {
        name: "total",
        type: "number",
        required: false,
      },
      {
        name: "currency",
        type: "text",
        required: false,
      },
      {
        name: "status",
        type: "text",
        required: false,
      },
      {
        name: "payment_method",
        type: "text",
        required: false,
      },
      {
        name: "paid_date",
        type: "date",
        required: false,
      },
      {
        name: "seller_name",
        type: "text",
        required: false,
      },
      {
        name: "seller_eik",
        type: "text",
        required: false,
      },
      {
        name: "seller_address",
        type: "text",
        required: false,
      },
      {
        name: "seller_vat_number",
        type: "text",
        required: false,
      },
      {
        name: "seller_mol",
        type: "text",
        required: false,
      },
      {
        name: "pdf_file",
        type: "file",
        required: false,
        maxSelect: 1,
        maxSize: 5242880,
        mimeTypes: ["application/pdf"],
      },
      {
        name: "issued_by",
        type: "text",
        required: false,
      },
    ],
  });

  try {
    app.save(invoices);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("invoices already exists, skipping");
  }

  // Create channels collection
  let channels = new Collection({
    name: "channels",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "name",
        type: "text",
        required: true,
        presentable: true,
      },
      {
        name: "channel_code",
        type: "text",
        required: true,
      },
      {
        name: "api_key",
        type: "text",
        required: false,
      },
      {
        name: "hotel_code",
        type: "text",
        required: false,
      },
      {
        name: "is_connected",
        type: "bool",
        required: false,
      },
      {
        name: "last_sync",
        type: "date",
        required: false,
      },
      {
        name: "sync_status",
        type: "text",
        required: false,
      },
    ],
  });

  try {
    app.save(channels);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("channels already exists, skipping");
  }

  // Create housekeeping_log collection
  let housekeepingLog = new Collection({
    name: "housekeeping_log",
    type: "base",
    createRule: null,
    updateRule: null,
    deleteRule: null,
    listRule: null,
    viewRule: null,
    fields: [
      {
        name: "room_id",
        type: "text",
        required: true,
      },
      {
        name: "status",
        type: "text",
        required: true,
      },
      {
        name: "cleaned_by",
        type: "text",
        required: false,
      },
      {
        name: "notes",
        type: "text",
        required: false,
      },
      {
        name: "logged_at",
        type: "date",
        required: false,
      },
    ],
  });

  try {
    app.save(housekeepingLog);
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
    console.log("housekeeping_log already exists, skipping");
  }
}, (app) => {
  const collections = [
    "room_types", "payment_methods", "folios", "charges",
    "payments", "invoices", "channels", "housekeeping_log"
  ];
  for (const name of collections) {
    try {
      let col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (e) {
      if (e.message.includes("no rows in result set")) continue;
      throw e;
    }
  }
})
