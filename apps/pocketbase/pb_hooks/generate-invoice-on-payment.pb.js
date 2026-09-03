/// <reference path="../pb_data/types.d.ts" />

// Auto-generate a Bulgarian invoice (фактура) when a booking's payment
// completes. One invoice per booking — idempotent.

// ---------------------------------------------------------------------------
// SELLER DETAILS — TODO: replace with the hotel's real legal requisites.
// These are mandatory fields of a Bulgarian invoice (чл. 114 ЗСЧПИ).
// ---------------------------------------------------------------------------
const SELLER_NAME = "Raya Boutique Hotel"; // Legal entity name (фирма)
const SELLER_ADDRESS = "Sunny Beach, Bulgaria"; // Registered address (адрес)
const SELLER_EIK = "000000000"; // ЕИКА/БУЛСТАТ — REQUIRED, replace with real value
const SELLER_VAT_NUMBER = "BG000000000"; // ДДС регистрационен номер (if VAT registered)
const SELLER_MOL = ""; // Представляващ (мол) — e.g. "Rayna Indzhova"

// VAT: accommodation services in Bulgaria use the reduced rate (currently 9%).
// If the hotel is NOT VAT registered, set VAT_REGISTERED to false.
const VAT_REGISTERED = true;
const VAT_RATE = 9;

function nextInvoiceNumber(app) {
  // Sequential 10-digit invoice number (НОРДФ requirement).
  let maxNumber = 0;
  try {
    const records = app.findRecordsByFilter(
      "invoices",
      "",
      "-invoice_number",
      1,
      0
    );
    if (records.length > 0) {
      maxNumber = parseInt(records[0].get("invoice_number"), 10) || 0;
    }
  } catch (err) {
    // Collection may be empty or not migrated yet — start from 0.
  }
  const next = maxNumber + 1;
  return String(next).padStart(10, "0");
}

function round2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

onRecordAfterUpdateSuccess((e) => {
  if (e.collection.name !== "bookings") {
    e.next();
    return;
  }

  try {
    const original = e.record.original();
    const currentPaymentStatus = e.record.get("payment_status");
    const previousPaymentStatus = original.get("payment_status");

    // Only fire once: when payment_status transitions to "completed".
    if (previousPaymentStatus === "completed" || currentPaymentStatus !== "completed") {
      e.next();
      return;
    }

    const bookingId = e.record.id;

    // Idempotency: skip if an invoice already exists for this booking.
    try {
      const existing = $app.findFirstRecordByFilter(
        "invoices",
        "booking = ?",
        { params: [bookingId] }
      );
      if (existing) {
        console.log(`[INVOICE] Invoice ${existing.get("invoice_number")} already exists for booking ${bookingId}; skipping`);
        e.next();
        return;
      }
    } catch (err) {
      // No existing invoice — continue with generation.
    }

    const collection = $app.findCollectionByNameOrId("invoices");
    const invoice = new Record(collection);

    const total = round2(e.record.get("final_price"));
    let net = total;
    let vatAmount = 0;
    if (VAT_REGISTERED && VAT_RATE > 0) {
      net = round2(total / (1 + VAT_RATE / 100));
      vatAmount = round2(total - net);
    }

    const checkIn = String(e.record.get("check_in_date") || "").slice(0, 10);
    const checkOut = String(e.record.get("check_out_date") || "").slice(0, 10);
    const roomType = e.record.get("room_type") || e.record.get("accommodationType") || "Стая";

    invoice.set("invoice_number", nextInvoiceNumber($app));
    invoice.set("issue_date", new Date().toISOString());
    invoice.set("tax_event_date", e.record.get("updated") || new Date().toISOString());
    invoice.set("booking", bookingId);
    invoice.set("guest_name", e.record.get("guest_name") || "Guest");
    invoice.set("guest_address", "");
    invoice.set("guest_identifier", "");
    invoice.set("guest_country", "");
    invoice.set("seller_name", SELLER_NAME);
    invoice.set("seller_address", SELLER_ADDRESS);
    invoice.set("seller_eik", SELLER_EIK);
    invoice.set("seller_vat_number", VAT_REGISTERED ? SELLER_VAT_NUMBER : "");
    invoice.set("seller_mol", SELLER_MOL);
    invoice.set(
      "description",
      `Престой: ${roomType}, ${checkIn} – ${checkOut}`
    );
    invoice.set("net_amount", net);
    invoice.set("vat_rate", VAT_REGISTERED ? VAT_RATE : 0);
    invoice.set("vat_amount", vatAmount);
    invoice.set("total_amount", total);
    invoice.set("currency", "EUR");
    invoice.set("payment_method", "Card (Stripe)");
    invoice.set("original_copy", "ОРИГИНАЛ");

    $app.dao().saveRecord(invoice);

    console.log(
      `[INVOICE] Invoice ${invoice.get("invoice_number")} generated for booking ${bookingId} (total EUR ${total.toFixed(2)})`
    );
  } catch (err) {
    // Never break the payment flow because of invoicing.
    console.log(`[INVOICE][EXCEPTION] Could not generate invoice: ${err.message}`);
  }

  e.next();
}, "bookings");
