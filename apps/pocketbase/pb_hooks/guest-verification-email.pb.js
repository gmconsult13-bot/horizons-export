/// <reference path="../pb_data/types.d.ts" />

// Customize PocketBase's native verification email while preserving its
// signed verification token. The frontend confirms this token with
// pb.collection('guests').confirmVerification(token).
onMailerRecordVerificationSend((e) => {
  const token = e.meta.token;
  const verificationUrl =
    'https://rayaboutique.eu/verify-email?token=' + encodeURIComponent(token);

  e.message.subject = 'Verify your email - Raya Boutique';
  e.message.html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;line-height:1.6">
      <div style="text-align:center;padding:24px 0;border-bottom:2px solid #8b7355">
        <h1 style="color:#8b7355;margin:0;font-size:28px">Raya Boutique</h1>
      </div>
      <div style="padding:30px 0">
        <p>Hello,</p>
        <p>Thank you for creating an account with Raya Boutique.</p>
        <p>Please verify your email address to activate your account and manage your bookings.</p>
        <div style="text-align:center;margin:32px 0">
          <a href="${verificationUrl}" style="display:inline-block;background:#8b7355;color:#fff;padding:14px 32px;text-decoration:none;border-radius:4px;font-weight:bold">Verify Email</a>
        </div>
        <p style="font-size:13px;color:#666">If the button does not work, copy this address into your browser:</p>
        <p style="font-size:13px;word-break:break-all"><a href="${verificationUrl}" style="color:#8b7355">${verificationUrl}</a></p>
        <p>If you did not create this account, you can ignore this email.</p>
      </div>
      <div style="border-top:1px solid #ddd;padding-top:18px;text-align:center;font-size:12px;color:#777">Raya Boutique Hotel</div>
    </div>
  `;
  e.message.text =
    'Verify your Raya Boutique account:\n\n' +
    verificationUrl +
    '\n\nIf you did not create this account, you can ignore this email.';

  e.next();
}, 'guests');
