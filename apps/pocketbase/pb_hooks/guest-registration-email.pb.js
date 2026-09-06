/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const recipients = [{ address: "booking@rayaboutique.eu" }];
  const guestEmail = e.record.get("guest_email");
  if (guestEmail) {
    recipients.push({ address: guestEmail });
  }

  const message = new MailerMessage({
    from: {
      address: "booking@rayaboutique.eu",
      name: $app.settings().meta.senderName
    },
    to: recipients,
    subject: "New Booking Confirmation - " + e.record.id,
    html: "<h1>New Booking Registration</h1><p><strong>Guest Name:</strong> " + e.record.get("guest_name") + "</p><p><strong>Guest Email:</strong> " + e.record.get("guest_email") + "</p><p><strong>Check-in:</strong> " + e.record.get("check_in_date") + "</p><p><strong>Check-out:</strong> " + e.record.get("check_out_date") + "</p><p><strong>Room Type:</strong> " + e.record.get("room_type") + "</p><p><strong>Number of Guests:</strong> " + e.record.get("number_of_guests") + "</p><p><strong>Total Price:</strong> " + e.record.get("final_price") + "</p><p><strong>Payment Status:</strong> " + e.record.get("payment_status") + "</p>"
  });
  $app.newMailClient().send(message);
  e.next();
}, "bookings");
