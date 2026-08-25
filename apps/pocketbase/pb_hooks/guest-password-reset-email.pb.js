/// <reference path="../pb_data/types.d.ts" />

// Customize PocketBase's native password-reset email and keep the native
// signed token that confirmPasswordReset expects.
onMailerRecordPasswordResetSend((e) => {
  if (e.record.collection().name !== 'guests') {
    e.next();
    return;
  }

  const token = e.meta.token;
  const resetUrl =
    'https://rayaboutique.eu/reset-password?token=' + encodeURIComponent(token);

  e.message.subject = 'Reset your password - Raya Boutique';
  e.message.html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.6">
      <div style="text-align:center;padding:24px 0;border-bottom:2px solid #8b7355">
        <h1 style="color:#8b7355;margin:0;font-size:28px">Raya Boutique</h1>
      </div>
      <div style="padding:30px 0">
        <p>Hello,</p>
        <p>We received a request to reset the password for your Raya Boutique account.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetUrl}" style="display:inline-block;background:#8b7355;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold">Reset Password</a>
        </div>
        <p style="font-size:13px;color:#666">If the button does not work, copy this address into your browser:</p>
        <p style="font-size:13px;word-break:break-all"><a href="${resetUrl}" style="color:#8b7355">${resetUrl}</a></p>
        <p>If you did not request a password reset, you can ignore this email.</p>
      </div>
      <div style="border-top:1px solid #ddd;padding-top:18px;text-align:center;font-size:12px;color:#777">Raya Boutique Hotel</div>
    </div>
  `;
  e.message.text =
    'Reset your Raya Boutique password:\n\n' +
    resetUrl +
    '\n\nIf you did not request this change, you can ignore this email.';

  e.next();
}, 'guests');
