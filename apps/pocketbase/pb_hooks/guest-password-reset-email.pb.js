/// <reference path="../pb_data/types.d.ts" />
onRecordAfterUpdateSuccess((e) => {
  // Only send email if password_reset_token was set
  const resetToken = e.record.get("password_reset_token");
  if (!resetToken) {
    e.next();
    return;
  }

  const guestEmail = e.record.get("email");
  const guestName = e.record.get("name") || "Guest";
  
  // Construct the reset link with the correct domain
  const resetLink = "https://rayaboutique.eu/reset-password?token=" + resetToken;

  // HTML email version
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>Hello ${guestName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${resetLink}">${resetLink}</a></p>
      
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">Raya Boutique Hotel</p>
    </div>
  `;

  // Plain text email version
  const plainTextContent = `
Password Reset Request

Hello ${guestName},

We received a request to reset your password. Click the link below to create a new password:

${resetLink}

This link will expire in 24 hours.

If you didn't request a password reset, please ignore this email.

---
Raya Boutique Hotel
  `;

  const message = new MailerMessage({
    from: {
      address: "info@rayaboutique.eu",
      name: "Raya Boutique"
    },
    to: [{ address: guestEmail }],
    subject: "Password Reset Request - Raya Boutique",
    html: htmlContent,
    text: plainTextContent
  });

  $app.newMailClient().send(message);
  e.next();
}, "guests");
