/// <reference path="../pb_data/types.d.ts" />
// Fix critical live issues found 2026-09-06 during end-to-end guest journey testing:
//  1. Bookings were publicly readable (empty listRule/viewRule) — all guest PII
//     (names, emails, phones, dates) was exposed to anyone without login (GDPR risk).
//  2. Required number fields rejected 0 — the website always sends 0 for
//     num_children / meal_total / meal_plan_cost / guest_surcharges on room-only
//     bookings, so every real guest's booking create failed validation and
//     nobody could ever reach Stripe. These fields are now optional.
migrate((app) => {
  const bookings = app.findCollectionByNameOrId("bookings");

  // --- 1. Access rules: only the owning guest or an admin can read bookings ---
  const ownerOrAdmin = "guest_id = @request.auth.id || @request.auth.role = 'admin'";
  bookings.listRule = ownerOrAdmin;
  bookings.viewRule = ownerOrAdmin;

  // Bookings can only be created by authenticated users (blocks anonymous spam
  // creates; the website requires login before checkout anyway).
  bookings.createRule = "@request.auth.id != ''";

  // --- 2. Make zero-able number fields optional ---
  const optionalFields = ["num_children", "meal_total", "meal_plan_cost", "guest_surcharges"];
  for (const name of optionalFields) {
    const field = bookings.fields.getByName(name);
    if (field) {
      field.required = false;
    }
  }

  app.save(bookings);
}, (app) => {
  // Down migration: restore the previous (unsafe) state — for reference only.
  const bookings = app.findCollectionByNameOrId("bookings");
  bookings.listRule = "";
  bookings.viewRule = "";
  bookings.createRule = "";
  const optionalFields = ["num_children", "meal_total", "meal_plan_cost", "guest_surcharges"];
  for (const name of optionalFields) {
    const field = bookings.fields.getByName(name);
    if (field) {
      field.required = true;
    }
  }
  app.save(bookings);
});
