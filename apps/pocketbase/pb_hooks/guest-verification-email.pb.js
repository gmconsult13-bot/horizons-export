/// <reference path="../pb_data/types.d.ts" />
onRecordAfterCreateSuccess((e) => {
  const guestEmail = e.record.get("email");
  if (!guestEmail) {
    e.next();
    return;
  }

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
            <p>Your account has been created successfully. We look forward to welcoming you soon.</p>
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

  const message = new MailerMessage({
    from: {
      address: $app.settings().meta.senderAddress,
      name: $app.settings().meta.senderName || 'Ray Aboutique'
    },
    to: [{ address: guestEmail }],
    subject: "Welcome to Ray Aboutique",
    html: htmlBody
  });

  $app.newMailClient().send(message);

  e.next();
}, "guests");
