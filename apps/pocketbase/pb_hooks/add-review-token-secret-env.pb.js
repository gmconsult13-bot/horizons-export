/// <reference path="../pb_data/types.d.ts" />
// This is a placeholder hook file
// The REVIEW_TOKEN_SECRET should be added to apps/api/.env manually:
// REVIEW_TOKEN_SECRET=your-secure-random-string-here
// 
// Example secure random string (use a proper random generator in production):
// REVIEW_TOKEN_SECRET=sk_live_51234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnop
//
// This token is used by the send-review-email-after-checkout hook to generate
// HMAC-SHA256 tokens for review submission links, ensuring only legitimate
// booking reviews can be submitted.