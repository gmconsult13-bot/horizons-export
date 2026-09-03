/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ==========================================
  // RESTAURANT MODULE (inspired by Dolphin 3 ЕЛИТ)
  // ==========================================

  // restaurant_tables — physical tables in the restaurant
  try {
    app.save(new Collection({
      name: "restaurant_tables",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "table_number", required: true, presentable: true }),
        new NumberField({ name: "capacity", required: true, min: 1, max: 20, onlyInt: true }),
        new NumberField({ name: "floor", required: false, onlyInt: true }),
        new TextField({ name: "area", required: false }), // "indoor", "terrace", "bar", "garden"
        new TextField({ name: "status", required: false }), // "available", "occupied", "reserved", "cleaning"
        new NumberField({ name: "position_x", required: false }),
        new NumberField({ name: "position_y", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // restaurant_menu_categories — menu sections (Starters, Mains, Desserts, Drinks...)
  try {
    app.save(new Collection({
      name: "restaurant_menu_categories",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "name_bg", required: false }),
        new NumberField({ name: "sort_order", required: false, onlyInt: true }),
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // restaurant_menu_items — individual dishes/drinks
  try {
    app.save(new Collection({
      name: "restaurant_menu_items",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "category_id", required: true }), // FK to menu_categories
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "name_bg", required: false }),
        new TextField({ name: "description", required: false }),
        new NumberField({ name: "price", required: true, min: 0 }),
        new TextField({ name: "currency", required: false }),
        new TextField({ name: "item_type", required: false }), // "food", "drink", "alcohol", "dessert"
        new BoolField({ name: "is_available", required: false }),
        new NumberField({ name: "vat_rate", required: false }), // 20% standard, 9% for some food
        new NumberField({ name: "sort_order", required: false, onlyInt: true }),
        new TextField({ name: "image", required: false }),
        new TextField({ name: "allergens", required: false }),
        new BoolField({ name: "is_vegetarian", required: false }),
        new BoolField({ name: "is_vegan", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // restaurant_orders — table orders (linked to table or room service)
  try {
    app.save(new Collection({
      name: "restaurant_orders",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "table_id", required: false }),
        new TextField({ name: "booking_id", required: false }), // if charged to room
        new TextField({ name: "folio_id", required: false }), // if posted to a folio
        new TextField({ name: "guest_name", required: false }),
        new TextField({ name: "order_type", required: true }), // "dine_in", "room_service", "takeaway", "bar", "breakfast"
        new TextField({ name: "status", required: false }), // "open", "preparing", "served", "paid", "cancelled"
        new NumberField({ name: "total", required: false, min: 0 }),
        new NumberField({ name: "vat_amount", required: false }),
        new NumberField({ name: "grand_total", required: false }),
        new TextField({ name: "payment_method", required: false }), // "cash", "card", "room_charge", "bank_transfer"
        new TextField({ name: "invoice_number", required: false }), // if invoice issued
        new TextField({ name: "server", required: false }), // waiter/staff name
        new TextField({ name: "notes", required: false }),
        new DateField({ name: "opened_at", required: false }),
        new DateField({ name: "closed_at", required: false }),
        new NumberField({ name: "num_guests", required: false, onlyInt: true }),
        new TextField({ name: "items_json", required: false }), // JSON array of order items
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // restaurant_inventory — stock management (Dolphin 3 style)
  try {
    app.save(new Collection({
      name: "restaurant_inventory",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "name_bg", required: false }),
        new TextField({ name: "unit", required: false }), // "kg", "liter", "piece", "bottle"
        new NumberField({ name: "quantity", required: false }),
        new NumberField({ name: "min_quantity", required: false }), // reorder threshold
        new NumberField({ name: "cost_per_unit", required: false }),
        new TextField({ name: "supplier", required: false }),
        new DateField({ name: "last_restocked", required: false }),
        new BoolField({ name: "is_active", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // restaurant_reservations — table reservations
  try {
    app.save(new Collection({
      name: "restaurant_reservations",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "guest_name", required: true }),
        new TextField({ name: "guest_phone", required: false }),
        new TextField({ name: "guest_email", required: false }),
        new NumberField({ name: "party_size", required: true, min: 1, onlyInt: true }),
        new DateField({ name: "reservation_date", required: true }),
        new TextField({ name: "reservation_time", required: true }), // "19:30"
        new TextField({ name: "table_id", required: false }),
        new TextField({ name: "status", required: false }), // "confirmed", "seated", "cancelled", "no_show"
        new TextField({ name: "notes", required: false }), // dietary requirements, special occasion
        new TextField({ name: "booking_id", required: false }), // link to hotel booking if staying
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // ==========================================
  // TOUR OPERATOR CONTRACTS MODULE
  // ==========================================

  // tour_operators — the TO companies
  try {
    app.save(new Collection({
      name: "tour_operators",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "name", required: true, presentable: true }),
        new TextField({ name: "country", required: false }),
        new TextField({ name: "contact_name", required: false }),
        new TextField({ name: "contact_email", required: false }),
        new TextField({ name: "contact_phone", required: false }),
        new TextField({ name: "eik", required: false }), // Bulgarian company ID
        new TextField({ name: "vat_number", required: false }),
        new TextField({ name: "address", required: false }),
        new NumberField({ name: "commission_rate", required: false }), // percentage
        new TextField({ name: "billing_cycle", required: false }), // "monthly", "biweekly", "per_stay"
        new TextField({ name: "currency", required: false }), // "EUR", "BGN"
        new BoolField({ name: "is_active", required: false }),
        new TextField({ name: "notes", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_contracts — contract terms with each TO for a season
  try {
    app.save(new Collection({
      name: "to_contracts",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "tour_operator_id", required: true }), // FK to tour_operators
        new TextField({ name: "contract_number", required: false }),
        new DateField({ name: "season_start", required: true }),
        new DateField({ name: "season_end", required: true }),
        new TextField({ name: "status", required: false }), // "draft", "active", "expired", "cancelled"
        new TextField({ name: "board_type", required: false }), // "BB", "HB", "FB", "AI" (bed&breakfast, half, full, all-inclusive)
        new NumberField({ name: "allotment_rooms", required: false, onlyInt: true }), // rooms allocated
        new NumberField({ name: "release_days", required: false, onlyInt: true }), // release period (e.g. 45 days)
        new TextField({ name: "rate_structure_json", required: false }), // JSON: seasonal rate grid
        new BoolField({ name: "children_free_under", required: false }),
        new NumberField({ name: "max_free_children_age", required: false, onlyInt: true }),
        new NumberField({ name: "child_discount_percent", required: false }), // % off adult rate
        new NumberField({ name: "early_booking_discount", required: false }), // % off for early booking
        new NumberField({ name: "early_booking_deadline_days", required: false, onlyInt: true }),
        new TextField({ name: "promotion_rules_json", required: false }), // e.g. {"7=10": {"stay7pay10": true}}
        new TextField({ name: "payment_terms", required: false }), // "prepaid", "post_stay", "deposit_30"
        new NumberField({ name: "deposit_percent", required: false }),
        new DateField({ name: "signed_date", required: false }),
        new TextField({ name: "signed_by", required: false }),
        new TextField({ name: "notes", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_contract_rates — specific room type rates per date range within a contract
  try {
    app.save(new Collection({
      name: "to_contract_rates",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "contract_id", required: true }), // FK to to_contracts
        new TextField({ name: "room_type_id", required: true }), // FK to room_types
        new TextField({ name: "season_name", required: false }), // "Peak", "Shoulder", "Low"
        new DateField({ name: "date_from", required: true }),
        new DateField({ name: "date_to", required: true }),
        new NumberField({ name: "adult_rate", required: true, min: 0 }),
        new NumberField({ name: "child_rate", required: false, min: 0 }),
        new NumberField({ name: "single_supplement", required: false }), // extra for single occupancy
        new NumberField({ name: "third_bed_discount", required: false }), // % off for 3rd bed
        new NumberField({ name: "board_supplement_bb", required: false }), // B&B supplement
        new NumberField({ name: "board_supplement_hb", required: false }), // Half board supplement
        new NumberField({ name: "board_supplement_fb", required: false }), // Full board supplement
        new TextField({ name: "currency", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_allotments — monthly allotment tracking per TO
  try {
    app.save(new Collection({
      name: "to_allotments",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "contract_id", required: true }), // FK to to_contracts
        new TextField({ name: "tour_operator_id", required: true }), // FK to tour_operators
        new DateField({ name: "month", required: true }), // first day of month
        new NumberField({ name: "allocated_rooms", required: true, onlyInt: true }),
        new NumberField({ name: "sold_rooms", required: false, onlyInt: true }),
        new NumberField({ name: "available_rooms", required: false, onlyInt: true }),
        new NumberField({ name: "pickup_percent", required: false }), // sold / allocated * 100
        new DateField({ name: "release_date", required: false }), // when unsold rooms return to free sale
        new BoolField({ name: "is_released", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_bookings — TO-originated bookings (extends standard bookings with TO-specific fields)
  try {
    app.save(new Collection({
      name: "to_bookings",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "booking_id", required: true }), // FK to standard bookings
        new TextField({ name: "contract_id", required: true }), // FK to to_contracts
        new TextField({ name: "tour_operator_id", required: true }), // FK to tour_operators
        new TextField({ name: "to_reference", required: false }), // TO's own booking reference
        new TextField({ name: "voucher_number", required: false }), // voucher presented at check-in
        new TextField({ name: "rooming_list_id", required: false }), // if imported via rooming list
        new DateField({ name: "arrival_date", required: false }),
        new DateField({ name: "departure_date", required: false }),
        new TextField({ name: "transfer_info", required: false }), // flight number, arrival time
        new TextField({ name: "board_type", required: false }), // BB, HB, FB, AI
        new NumberField({ name: "contracted_rate", required: false }), // rate per TO contract
        new NumberField({ name: "commission_amount", required: false }),
        new NumberField({ name: "net_to_hotel", required: false }), // after commission
        new TextField({ name: "billing_status", required: false }), // "pending", "invoiced", "paid"
        new TextField({ name: "to_invoice_number", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_rooming_lists — bulk import of guest names for group bookings
  try {
    app.save(new Collection({
      name: "to_rooming_lists",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "contract_id", required: true }),
        new TextField({ name: "tour_operator_id", required: true }),
        new TextField({ name: "group_name", required: false }),
        new DateField({ name: "arrival_date", required: false }),
        new DateField({ name: "departure_date", required: false }),
        new NumberField({ name: "total_guests", required: false, onlyInt: true }),
        new NumberField({ name: "total_rooms", required: false, onlyInt: true }),
        new TextField({ name: "status", required: false }), // "draft", "imported", "confirmed", "checked_in"
        new TextField({ name: "guests_json", required: false }), // JSON array of guest data
        new DateField({ name: "imported_at", required: false }),
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }

  // to_invoices — billing to tour operators
  try {
    app.save(new Collection({
      name: "to_invoices",
      type: "base",
      createRule: null, updateRule: null, deleteRule: null, listRule: null, viewRule: null,
      fields: [
        new TextField({ name: "invoice_number", required: true, presentable: true }),
        new TextField({ name: "tour_operator_id", required: true }),
        new TextField({ name: "contract_id", required: false }),
        new DateField({ name: "invoice_date", required: true }),
        new DateField({ name: "period_from", required: false }),
        new DateField({ name: "period_to", required: false }),
        new TextField({ name: "items_json", required: false }), // JSON of line items (bookings, dates, amounts)
        new NumberField({ name: "subtotal", required: false }),
        new NumberField({ name: "vat_rate", required: false }),
        new NumberField({ name: "vat_amount", required: false }),
        new NumberField({ name: "commission_total", required: false }),
        new NumberField({ name: "net_total", required: false }), // after commission
        new NumberField({ name: "total", required: false }),
        new TextField({ name: "currency", required: false }),
        new TextField({ name: "status", required: false }), // "draft", "issued", "paid", "overdue"
        new DateField({ name: "paid_date", required: false }),
        new TextField({ name: "booking_ids_json", required: false }), // which bookings are included
      ],
    }));
  } catch (e) { if (!e.message.includes("Collection name must be unique")) throw e; }
}, (app) => {
  const collections = [
    "restaurant_tables", "restaurant_menu_categories", "restaurant_menu_items",
    "restaurant_orders", "restaurant_inventory", "restaurant_reservations",
    "tour_operators", "to_contracts", "to_contract_rates", "to_allotments",
    "to_bookings", "to_rooming_lists", "to_invoices",
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
