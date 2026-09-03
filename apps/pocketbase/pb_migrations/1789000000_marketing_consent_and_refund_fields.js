/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // ===== guests: add name + marketing_consent =====
  const guests = app.findCollectionByNameOrId("guests");

  if (!guests.fields.getByName("name")) {
    guests.fields.add(new TextField({
      name: "name",
      required: false,
    }));
  }

  if (!guests.fields.getByName("marketing_consent")) {
    guests.fields.add(new BoolField({
      name: "marketing_consent",
    }));
  }

  if (!guests.fields.getByName("marketing_consent_at")) {
    guests.fields.add(new DateField({
      name: "marketing_consent_at",
      required: false,
    }));
  }

  app.save(guests);

  // ===== bookings: add refund + cancellation tracking + booking_status =====
  const bookings = app.findCollectionByNameOrId("bookings");

  if (!bookings.fields.getByName("booking_status")) {
    bookings.fields.add(new SelectField({
      name: "booking_status",
      required: false,
      values: ["confirmed", "cancelled"],
    }));
  }

  if (!bookings.fields.getByName("refund_status")) {
    bookings.fields.add(new SelectField({
      name: "refund_status",
      required: false,
      values: ["none", "requested", "partial", "full", "failed"],
    }));
  }

  if (!bookings.fields.getByName("refund_amount")) {
    bookings.fields.add(new NumberField({
      name: "refund_amount",
      required: false,
    }));
  }

  if (!bookings.fields.getByName("cancelled_at")) {
    bookings.fields.add(new DateField({
      name: "cancelled_at",
      required: false,
    }));
  }

  if (!bookings.fields.getByName("cancellation_reason")) {
    bookings.fields.add(new TextField({
      name: "cancellation_reason",
      required: false,
    }));
  }

  return app.save(bookings);
}, (app) => {
  try {
    const guests = app.findCollectionByNameOrId("guests");
    guests.fields.removeByName("name");
    guests.fields.removeByName("marketing_consent");
    guests.fields.removeByName("marketing_consent_at");
    app.save(guests);

    const bookings = app.findCollectionByNameOrId("bookings");
    bookings.fields.removeByName("booking_status");
    bookings.fields.removeByName("refund_status");
    bookings.fields.removeByName("refund_amount");
    bookings.fields.removeByName("cancelled_at");
    bookings.fields.removeByName("cancellation_reason");
    return app.save(bookings);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Collection not found, skipping revert");
      return;
    }
    throw e;
  }
})
