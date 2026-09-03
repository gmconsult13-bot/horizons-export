/// <reference path="../pb_data/types.d.ts" />
onRecordAfterUpdateSuccess((e) => {
  // Only process bookings collection
  if (e.collection.name !== 'bookings') {
    e.next();
    return;
  }

  try {
    const original = e.record.original();
    const currentPaymentStatus = e.record.get('payment_status');
    const previousPaymentStatus = original.get('payment_status');
    
    // Check if payment_status changed to 'completed'
    if (previousPaymentStatus !== 'completed' && currentPaymentStatus === 'completed') {
      const checkOutDate = e.record.get('check_out_date');
      const today = new Date();
      const checkOut = new Date(checkOutDate);
      
      // Check if check_out_date has passed
      if (checkOut <= today) {
        const bookingId = e.record.id;
        const guestEmail = e.record.get('guest_email');
        const guestName = e.record.get('guest_name');
        
        // Check if review already exists for this booking
        try {
          const existingReview = $app.findFirstRecordByFilter('guest_reviews', 'booking = ?', { params: [bookingId] });
          if (existingReview) {
            // Review already exists, skip email
            e.next();
            return;
          }
        } catch (err) {
          // No existing review found, continue
        }
        
        // Generate secure token: HMAC-SHA256(booking_id) using PocketBase's built-in $security helper
        // (require('crypto') does not exist in PocketBase's JS runtime and would throw)
        const secret = $app.settings().meta.REVIEW_TOKEN_SECRET || 'default-secret';
        const token = $security.hs256(bookingId, secret);
        
        // Build review link
        const reviewLink = 'https://rayaboutique.eu/reviews/submit?booking_id=' + bookingId + '&token=' + token;
        
        // Send email
        const message = new MailerMessage({
          from: {
            address: $app.settings().meta.senderAddress,
            name: $app.settings().meta.senderName
          },
          to: [{ address: guestEmail }],
          subject: 'Share Your Stay Experience at Raya Boutique',
          html: '<h2>Thank You for Your Stay, ' + guestName + '! (Raya Boutique)</h2>' +
                '<p>We hope you had a wonderful experience at our hotel. Your feedback is invaluable to us and helps us continue to improve our services.</p>' +
                '<h3>Rate Your Experience</h3>' +
                '<p>We would love to hear about your stay. Please rate the following aspects on a scale of 1-6:</p>' +
                '<ul>' +
                '<li><strong>Hotel Overall:</strong> How would you rate the hotel overall?</li>' +
                '<li><strong>Cleanliness:</strong> How clean was your room and the facilities?</li>' +
                '<li><strong>Service:</strong> How would you rate the service provided by our staff?</li>' +
                '<li><strong>Food Quality:</strong> How was the quality of food and dining experience?</li>' +
                '<li><strong>Price-Quality Ratio:</strong> Did you feel the price matched the quality of service?</li>' +
                '</ul>' +
                '<p><strong>Rating Scale:</strong> 1 = Poor, 2 = Fair, 3 = Good, 4 = Very Good, 5 = Excellent, 6 = Outstanding</p>' +
                '<p><a href="' + reviewLink + '" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Submit Your Review</a></p>' +
                '<p><strong>Deadline:</strong> Please submit your review within 7 days of checkout for the most accurate feedback.</p>' +
                '<p>If you have any questions or concerns, please don\'t hesitate to contact us at <strong>info@rayaboutique.eu</strong>.</p>' +
                '<p>Thank you for choosing us!</p>' +
                '<p>Best regards,<br>Raya Boutique Hotel Team</p>'
        });
        
        $app.newMailClient().send(message);
        
        // Log email sent for audit
        console.log('Review email sent to ' + guestEmail + ' for booking ' + bookingId);
      }
    }
  } catch (err) {
    // Log error but do NOT throw to prevent booking completion failure
    console.log('Error sending review email: ' + err.message);
  }
  
  e.next();
}, 'bookings');