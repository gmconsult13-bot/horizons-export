/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ==========================================
  // CHANNEL MANAGER MODULE
  // ==========================================

  // channel_otas — OTA channel configurations
  try {
    app.save(new Collection({
      name: "channel_otas",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }), // "Booking.com", "Agoda", "Expedia", "Airbnb"
        new TextField({ name: "ota_code", required: true }), // "booking_com", "agoda", "expedia", "airbnb"
        new TextField({ name: "hotel_id_on_ota", required: false }), // OTA's internal hotel ID
        new TextField({ name: "api_username", required: false }),
        new TextField({ name: "api_password", required: false }),
        new TextField({ name: "api_key", required: false }),
        new TextField({ name: "webhook_url", required: false }), // OTA -> our system
        new TextField({ name: "connection_status", required: false }), // "connected", "disconnected", "error", "pending"
        new BoolField({ name: "is_active", required: false }),
        new DateField({ name: "last_sync", required: false }),
        new TextField({ name: "sync_status", required: false }), // "synced", "syncing", "error"
        new TextField({ name: "sync_error", required: false }),
        new TextField({ name: "commission_rate", required: false }), // OTA commission %
        new TextField({ name: "currency", required: false }), // what currency OTA pays in
        new BoolField({ name: "auto_sync", required: false }),
        new NumberField({ name: "sync_interval_minutes", required: false, onlyInt: true }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // channel_room_mappings — maps our room types to OTA room types
  try {
    app.save(new Collection({
      name: "channel_room_mappings",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "ota_id", required: true }), // FK to channel_otas
        new TextField({ name: "room_type_id", required: true }), // FK to our room_types
        new TextField({ name: "ota_room_code", required: false }), // OTA's room code
        new TextField({ name: "ota_rate_plan_code", required: false }), // OTA's rate plan code
        new NumberField({ name: "ota_capacity", required: false, onlyInt: true }),
        new NumberField({ name: "price_markup_percent", required: false }), // markup over our base price
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // channel_rate_updates — rate/availability push log
  try {
    app.save(new Collection({
      name: "channel_rate_updates",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "ota_id", required: true }),
        new TextField({ name: "room_type_id", required: false }),
        new DateField({ name: "stay_date", required: false }), // date being updated
        new NumberField({ name: "price", required: false }),
        new NumberField({ name: "available", required: false, onlyInt: true }),
        new NumberField({ name: "min_stay", required: false, onlyInt: true }),
        new NumberField({ name: "max_stay", required: false, onlyInt: true }),
        new BoolField({ name: "closed_to_arrival", required: false }),
        new BoolField({ name: "closed_to_departure", required: false }),
        new TextField({ name: "update_type", required: false }), // "push", "pull"
        new TextField({ name: "status", required: false }), // "success", "failed", "pending"
        new TextField({ name: "error_message", required: false }),
        new DateField({ name: "pushed_at", required: false }),
        new DateField({ name: "confirmed_at", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // channel_bookings — bookings pulled from OTAs
  try {
    app.save(new Collection({
      name: "channel_bookings",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "ota_id", required: true }),
        new TextField({ name: "ota_booking_id", required: true }), // OTA's reservation ID
        new TextField({ name: "booking_id", required: false }), // FK to our bookings table (once created)
        new TextField({ name: "guest_name", required: false }),
        new TextField({ name: "guest_email", required: false }),
        new TextField({ name: "guest_phone", required: false }),
        new TextField({ name: "guest_country", required: false }),
        new DateField({ name: "check_in", required: false }),
        new DateField({ name: "check_out", required: false }),
        new TextField({ name: "room_type", required: false }),
        new NumberField({ name: "num_adults", required: false, onlyInt: true }),
        new NumberField({ name: "num_children", required: false, onlyInt: true }),
        new TextField({ name: "board_type", required: false }), // BB, HB, FB
        new NumberField({ name: "total_price", required: false }),
        new TextField({ name: "currency", required: false }),
        new NumberField({ name: "commission", required: false }),
        new TextField({ name: "payment_method", required: false }), // "OTA_collect", "property_collect"
        new TextField({ name: "status", required: false }), // "new", "imported", "cancelled_by_ota", "modified"
        new TextField({ name: "special_requests", required: false }),
        new DateField({ name: "ota_created_at", required: false }),
        new DateField({ name: "imported_at", required: false }),
        new BoolField({ name: "is_imported", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // channel_restrictions — stop-sell, min stay, etc. per date
  try {
    app.save(new Collection({
      name: "channel_restrictions",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "ota_id", required: true }),
        new TextField({ name: "room_type_id", required: false }),
        new DateField({ name: "date", required: true }),
        new BoolField({ name: "stop_sell", required: false }),
        new NumberField({ name: "min_stay_arrival", required: false, onlyInt: true }),
        new NumberField({ name: "max_stay", required: false, onlyInt: true }),
        new BoolField({ name: "closed_to_arrival", required: false }),
        new BoolField({ name: "closed_to_departure", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }
}, (app) => {
  const names = ["channel_otas", "channel_room_mappings", "channel_rate_updates", "channel_bookings", "channel_restrictions"];
  for (const name of names) {
    try { let col = app.findCollectionByNameOrId(name); app.delete(col); }
    catch (e) { if (e.message.includes("no rows in result set")) continue; throw e; }
  }
})
