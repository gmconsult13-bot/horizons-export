/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName
    },
    to: [{ address: "booking@rayaboutique.eu" }],
    subject: "New Guest Registration - " + e.record.get("email"),
    html: "<h1>Welcome New Guest!</h1><p><strong>Email:</strong> " + e.record.get("email") + "</p><p><strong>Phone:</strong> " + e.record.get("phone") + "</p><p>A new guest has registered in the system.</p>"
  });
  $app.newMailClient().send(message);
  e.next();
}, "guests");