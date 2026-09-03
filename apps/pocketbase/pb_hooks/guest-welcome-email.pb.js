/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const guestEmail = e.record.get("email");
  if (!guestEmail) {
    e.next();
    return;
  }

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName
    },
    to: [{ address: guestEmail }],
    subject: "Welcome to Ray Aboutique!",
    html: "<h1>Welcome to Ray Aboutique!</h1><p>Thank you for registering with us.</p><p>We are delighted to have you as our guest and look forward to your stay.</p><p>Best regards,<br>The Ray Aboutique Team</p>"
  });
  $app.newMailClient().send(message);
  e.next();
}, "guests");
