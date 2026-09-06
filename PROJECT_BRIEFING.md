# Project Briefing — Raya Boutique Hotel Platform

> Last updated: 2026-09-06 · Maintained by Nova (Base44 agent) on behalf of Rayna Indzhova

## Overview

Proprietary hotel management platform replacing third-party solutions (Exely/Anstea), covering two properties: **Raya Boutique Hotel** (Sunny Beach) and **Tropicana Family Hotel** (Ravda). Live guest-facing site: **https://rayaboutique.eu** (Hostinger Horizons hosting).

**Architecture:** monorepo
- `apps/web` — React + Vite frontend (guest booking site + admin panel)
- `apps/api` — Express API (Stripe payments, review tokens)
- `apps/pocketbase` — PocketBase 0.38 backend (collections, hooks, migrations)

Key routes on live: Express API proxied at `/hcgi/api`, PocketBase at `/hcgi/platform`.

## Current status (2026-09-06)

### ✅ Fixed and pushed (commit 87755d2, validated on a fresh PB 0.38 test server)

- **Guest PII exposure** — `bookings` collection had an empty `listRule` (all guest names/emails/phones publicly readable). Migration `1784200001` sets owner-or-admin rules; auth required to create.
- **Create-then-400 duplicates** — hooks used the removed `$app.dao()` API (crashed after save on every booking/guest create). All hooks rewritten for PB 0.38; hook failures are now logged and never fail a saved request.
- **Zero-rejecting validation** — `num_children`, `meal_total`, `meal_plan_cost`, `guest_surcharges` were required but rejected 0 (the frontend always sends 0 for room-only). Now optional.
- **Room availability never updated** — hook looked up the room by ID while `room_type` holds the name. Fixed; decrement/restore verified end-to-end (5→4→5). One booking = one room.
- **Stripe checkout** — amount now computed server-side from the booking record, verify endpoint marks bookings paid (webhook-independent safety net), signature-verified webhook endpoint added, EUR currency.
- **Migration bug** — `JsonField` → `JSONField` in migration `1783000001`.
- **Email senders** (commit c827534) — booking confirmations & review requests from `booking@rayaboutique.eu`; auth/system emails from `info@rayaboutique.eu`.

### ⏳ Pending — Hostinger deployment (requires Rayna)

1. **Publish** the updated code from the Horizons editor (pull latest from GitHub).
2. Set `STRIPE_SECRET_KEY` in Hostinger secrets — live payments currently fail ("Unable to start payment").
3. In the Stripe dashboard create a webhook: `checkout.session.completed` → `https://rayaboutique.eu/stripe/webhook`, and set `STRIPE_WEBHOOK_SECRET`.
4. Ensure `pocketbase migrate up` runs on deploy (or run it once manually).
5. Re-test a real booking end-to-end after deploy. **As of 2026-09-06 the fixes are NOT live yet** — anonymous guests can still read booking PII via the API.

### 🗑 Test data to delete from the live admin panel

- Guests: `ekgdstbi@guerrillamailblock.com` (Maya Testova), `privcheck8812@guerrillamailblock.com` (Priv Check)
- Bookings: `dmx8m7ruj29413m`, `ihoh985ld846f9a`, `ioxtskykvfcwrj0`, `q918tdp62vlroqh`

### 🔎 Known open issues (lower priority)

- SEO metadata missing on rayaboutique.eu (empty page title, no meta description).
- Cancellation policy hardcoded "flexible" — non-refundable rates not tracked.
- gmaconsult13@gmail.com over storage quota since Sep 5 — bouncing incoming mail (blocks password-reset/email-verification testing).
- Cloudflare anti-bot challenge affects guest UX on first visit.

## Platform roadmap (9 modules)

PMS · Channel Manager · Booking Engine · Reputation Manager · Price Monitor · Marketing Suite · Website Builder · Analytics · Bulgarian invoicing (фактура must be generated for guests, stored, printable for 3 months after stay).

## Conventions

- Booking correspondence sender: `booking@rayaboutique.eu`; official/correspondence address: `info@rayaboutique.eu`.
- Primary domain: `rayaboutique.eu`.
