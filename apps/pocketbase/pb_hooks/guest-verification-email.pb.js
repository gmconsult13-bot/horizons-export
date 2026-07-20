/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  // Generate a random 32-character verification token
  const crypto = require('crypto');
  const verificationToken = crypto.randomBytes(16).toString('hex');
  
  // Calculate token expiration (24 hours from now)
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiresAtString = expiresAt.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  
  // Update the guest record with verification token and expiration
  e.record.set('verification_token', verificationToken);
  e.record.set('token_expires_at', expiresAtString);
  
  // Save the updated record
  $app.save(e.record);
  
  // Prepare verification email
  const guestName = e.record.get('email') || 'Guest';
  const guestEmail = e.record.get('email');
  const verificationUrl = 'https://rayaboutique.eu/verify-email?token=' + verificationToken;
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #8b7355; }
        .header h1 { color: #8b7355; margin: 0; font-size: 28px; }
        .content { padding: 30px 0; }
        .welcome { font-size: 16px; margin-bottom: 20px; }
        .message { margin: 20px 0; font-size: 15px; }
        .button-container { text-align: center; margin: 30px 0; }
        .verify-button { 
          display: inline-block; 
          background-color: #8b7355; 
          color: white; 
          padding: 14px 32px; 
          text-decoration: none; 
          border-radius: 4px; 
          font-weight: bold; 
          font-size: 16px;
        }
        .verify-button:hover { background-color: #6d5844; }
        .fallback-link { 
          margin: 15px 0; 
          font-size: 14px; 
          word-break: break-all;
        }
        .fallback-link a { color: #8b7355; text-decoration: underline; }
        .expiration-notice { 
          background-color: #f5f5f5; 
          padding: 15px; 
          border-left: 4px solid #8b7355; 
          margin: 20px 0; 
          font-size: 14px;
        }
        .footer { 
          text-align: center; 
          padding-top: 20px; 
          border-top: 1px solid #ddd; 
          font-size: 12px; 
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Ray Aboutique</h1>
        </div>
        
        <div class="content">
          <div class="welcome">
            <p>Hello,</p>
          </div>
          
          <div class="message">
            <p>Thank you for creating your account with Ray Aboutique! We're excited to have you join our community.</p>
            
            <p>To complete your registration and unlock full access to your account, please verify your email address by clicking the button below:</p>
          </div>
          
          <div class="button-container">
            <a href="` + verificationUrl + `" class="verify-button">Verify Your Email</a>
          </div>
          
          <div class="fallback-link">
            <p>Or copy and paste this link in your browser:</p>
            <p><a href="` + verificationUrl + `">` + verificationUrl + `</a></p>
          </div>
          
          <div class="expiration-notice">
            <strong>⏰ Important:</strong> This verification link will expire in 24 hours. If you don't verify your email within this time, you may need to request a new verification link.
          </div>
          
          <div class="message">
            <p>If you did not create this account, please ignore this email.</p>
            <p>Best regards,<br><strong>The Ray Aboutique Team</strong></p>
          </div>
        </div>
        
        <div class="footer">
          <p>&copy; 2024 Ray Aboutique. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Send verification email
  const message = new MailerMessage({
    from: {
      address: 'info@rayaboutique.com',
      name: 'Ray Aboutique'
    },
    to: [{ address: guestEmail }],
    subject: 'Verify Your Email - Ray Aboutique',
    html: htmlBody
  });
  
  $app.newMailClient().send(message);
  
  e.next();
}, "guests");