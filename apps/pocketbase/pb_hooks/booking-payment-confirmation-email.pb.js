/// <reference path="../pb_data/types.d.ts" />

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

onRecordAfterUpdateSuccess((e) => {
  if (e.record.collection().name !== 'bookings') {
    e.next();
    return;
  }

  if (
    e.record.get('payment_status') !== 'completed' ||
    e.record.get('confirmation_email_sent') === true
  ) {
    e.next();
    return;
  }

  const guestEmail = e.record.get('guest_email');
  if (!guestEmail) {
    e.next();
    return;
  }

  const guestName = escapeHtml(e.record.get('guest_name') || 'Guest');
  const roomType = escapeHtml(e.record.get('room_type') || 'Room');
  const checkIn = escapeHtml(e.record.get('check_in_date'));
  const checkOut = escapeHtml(e.record.get('check_out_date'));
  const amount = Number(e.record.get('final_price') || 0).toFixed(2);
  const reference = escapeHtml(e.record.id);

  const message = new MailerMessage({
    from: {
      address: e.app.settings().meta.senderAddress || 'info@rayaboutique.eu',
      name: e.app.settings().meta.senderName || 'Raya Boutique',
    },
    to: [{ address: guestEmail }],
    subject: 'Booking confirmed - Raya Boutique',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#333;line-height:1.6">
        <div style="text-align:center;padding:24px 0;border-bottom:2px solid #8b7355">
          <h1 style="color:#8b7355;margin:0">Raya Boutique</h1>
        </div>
        <div style="padding:30px 0">
          <p>Hello ${guestName},</p>
          <p>Your payment has been received and your booking is confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:24px 0">
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Booking reference</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${reference}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Room</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${roomType}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Check-in</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${checkIn}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee"><strong>Check-out</strong></td><td style="padding:8px;border-bottom:1px solid #eee">${checkOut}</td></tr>
            <tr><td style="padding:8px"><strong>Paid</strong></td><td style="padding:8px"><strong>€${amount}</strong></td></tr>
          </table>
          <p>We look forward to welcoming you.</p>
          <p>Raya Boutique Hotel</p>
        </div>
      </div>
    `,
    text:
      `Booking confirmed - Raya Boutique\n\n` +
      `Hello ${guestName},\n` +
      `Booking reference: ${reference}\n` +
      `Room: ${roomType}\n` +
      `Check-in: ${checkIn}\n` +
      `Check-out: ${checkOut}\n` +
      `Paid: EUR ${amount}\n`,
  });

  try {
    e.app.newMailClient().send(message);
    e.record.set('confirmation_email_sent', true);
    e.app.save(e.record);
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error);
  }

  e.next();
}, 'bookings');
