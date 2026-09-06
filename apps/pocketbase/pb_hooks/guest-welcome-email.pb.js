/// <reference path="../pb_data/types.d.ts" />
// Guest welcome email (sent from the default sender, info@rayaboutique.eu).
// Fix (2026-09-06 live testing): a failing email send used to bubble up and
// fail the registration HTTP request even though the guest account was already
// created — guests saw an error, retried, and could not understand why
// "registration failed" while their login actually worked.
// Email delivery is best-effort: failures are logged, never fatal.
onRecordAfterCreateSuccess((e) => {
  const guestEmail = e.record.get("email");
  if (!guestEmail) {
    e.next();
    return;
  }

  try {
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
  } catch (err) {
    $app.logger().error(
      "Failed to send guest welcome email",
      "error", err.message,
      "guest", e.record.id
    );
  }

  e.next();
}, "guests");
