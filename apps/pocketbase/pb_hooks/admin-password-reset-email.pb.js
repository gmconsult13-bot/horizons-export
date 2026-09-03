/// <reference path="../pb_data/types.d.ts" />
onRecordUpdate((e) => {
  const passwordResetToken = e.record.get("password_reset_token");
  const userEmail = e.record.get("email");
  
  // Only send email if password_reset_token is being set (not null/empty)
  if (passwordResetToken && userEmail) {
    try {
      const resetLink = "https://rayaboutique.eu/admin/reset-password?token=" + passwordResetToken;
      
      const message = new MailerMessage({
        from: {
          address: $app.settings().meta.senderAddress,
          name: $app.settings().meta.senderName
        },
        to: [{ address: userEmail }],
        subject: "Admin Password Reset Request",
        html: "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">" +
              "<h2 style=\"color: #333;\">Password Reset Request</h2>" +
              "<p style=\"color: #666; line-height: 1.6;\">An administrator has requested a password reset for your account.</p>" +
              "<p style=\"color: #666; line-height: 1.6;\">Click the link below to reset your password:</p>" +
              "<p style=\"margin: 20px 0;\"><a href=\"" + resetLink + "\" style=\"background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;\">Reset Password</a></p>" +
              "<p style=\"color: #666; line-height: 1.6;\">Or copy and paste this link in your browser:</p>" +
              "<p style=\"color: #007bff; word-break: break-all;\">" + resetLink + "</p>" +
              "<hr style=\"border: none; border-top: 1px solid #ddd; margin: 20px 0;\">" +
              "<p style=\"color: #999; font-size: 12px;\"><strong>Security Notice:</strong> This password reset link is valid for 24 hours. If you did not request this reset, please contact your administrator immediately.</p>" +
              "<p style=\"color: #999; font-size: 12px;\">This is an automated message. Please do not reply to this email.</p>" +
              "</div>"
      });
      
      $app.newMailClient().send(message);
    } catch (error) {
      console.log("Password reset email failed for user " + userEmail + ": " + error.message);
    }
  }
  
  e.next();
}, "users");
