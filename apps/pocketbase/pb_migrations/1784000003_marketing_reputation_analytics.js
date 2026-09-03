/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // hotel_settings
  try {
    app.save(new Collection({
      name: "hotel_settings",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        { name: "hotel_name", type: "text", required: true, presentable: true },
        { name: "hotel_name_bg", type: "text", required: false },
        { name: "hotel_eik", type: "text", required: false },
        { name: "hotel_vat_number", type: "text", required: false },
        { name: "hotel_address", type: "text", required: false },
        { name: "hotel_city", type: "text", required: false },
        { name: "hotel_country", type: "text", required: false },
        { name: "hotel_mol", type: "text", required: false },
        { name: "hotel_phone", type: "text", required: false },
        { name: "hotel_email", type: "text", required: false },
        { name: "currency", type: "text", required: false },
        { name: "default_vat_rate", type: "number", required: false },
        { name: "invoice_prefix", type: "text", required: false },
        { name: "next_invoice_number", type: "number", required: false, onlyInt: true },
        { name: "check_in_time_default", type: "text", required: false },
        { name: "check_out_time_default", type: "text", required: false },
        { name: "facebook_pixel_id", type: "text", required: false },
        { name: "primary_color", type: "text", required: false },
      ].map(f => {
        if (f.type === "text") return new TextField({ name: f.name, required: f.required, presentable: f.presentable || false });
        if (f.type === "number") return new NumberField({ name: f.name, required: f.required, onlyInt: f.onlyInt || false });
        return new TextField({ name: f.name, required: f.required || false });
      }),
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // daily_stats
  try {
    app.save(new Collection({
      name: "daily_stats",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new DateField({ name: "date", required: true }),
        new NumberField({ name: "total_rooms", required: false, onlyInt: true }),
        new NumberField({ name: "occupied_rooms", required: false, onlyInt: true }),
        new NumberField({ name: "occupancy_rate", required: false }),
        new NumberField({ name: "revenue", required: false }),
        new NumberField({ name: "adr", required: false }),
        new NumberField({ name: "revpar", required: false }),
        new NumberField({ name: "arrivals", required: false, onlyInt: true }),
        new NumberField({ name: "departures", required: false, onlyInt: true }),
        new NumberField({ name: "bookings_created", required: false, onlyInt: true }),
        new NumberField({ name: "bookings_cancelled", required: false, onlyInt: true }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // marketing_campaigns
  try {
    app.save(new Collection({
      name: "marketing_campaigns",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "type", required: true }),
        new TextField({ name: "subject", required: false }),
        new TextField({ name: "content", required: false }),
        new TextField({ name: "target_segment", required: false }),
        new TextField({ name: "status", required: false }),
        new DateField({ name: "scheduled_at", required: false }),
        new NumberField({ name: "sent_count", required: false, onlyInt: true }),
        new NumberField({ name: "open_count", required: false, onlyInt: true }),
        new NumberField({ name: "click_count", required: false, onlyInt: true }),
        new TextField({ name: "created_by", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // marketing_automations
  try {
    app.save(new Collection({
      name: "marketing_automations",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "trigger", required: true }),
        new NumberField({ name: "trigger_value", required: false, onlyInt: true }),
        new TextField({ name: "channel", required: false }),
        new TextField({ name: "content", required: false }),
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // review_sources
  try {
    app.save(new Collection({
      name: "review_sources",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "source_code", required: true }),
        new TextField({ name: "rating_url", required: false }),
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // reviews
  try {
    app.save(new Collection({
      name: "reviews",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "source_id", required: false }),
        new TextField({ name: "guest_name", required: false }),
        new NumberField({ name: "rating", required: false }),
        new TextField({ name: "title", required: false }),
        new TextField({ name: "content", required: false }),
        new DateField({ name: "review_date", required: false }),
        new TextField({ name: "response", required: false }),
        new DateField({ name: "response_date", required: false }),
        new BoolField({ name: "is_responded", required: false }),
        new TextField({ name: "sentiment", required: false }),
        new TextField({ name: "booking_id", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // competitor_hotels
  try {
    app.save(new Collection({
      name: "competitor_hotels",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "ota_url", required: false }),
        new NumberField({ name: "star_rating", required: false, onlyInt: true }),
        new NumberField({ name: "distance_km", required: false }),
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }

  // price_checks
  try {
    app.save(new Collection({
      name: "price_checks",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "competitor_id", required: true }),
        new DateField({ name: "check_date", required: false }),
        new DateField({ name: "stay_date", required: false }),
        new NumberField({ name: "price", required: false }),
        new TextField({ name: "currency", required: false }),
        new TextField({ name: "room_type", required: false }),
        new TextField({ name: "source", required: false }),
      ],
    }));
  } catch (e) {
    if (!e.message.includes("Collection name must be unique")) throw e;
  }
}, (app) => {
  const names = [
    "hotel_settings", "daily_stats",
    "marketing_campaigns", "marketing_automations",
    "review_sources", "reviews",
    "competitor_hotels", "price_checks",
  ];
  for (const name of names) {
    try {
      let col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (e) {
      if (e.message.includes("no rows in result set")) continue;
      throw e;
    }
  }
})
