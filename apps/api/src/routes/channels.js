import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All channel manager routes require admin auth
router.use(authMiddleware, requireAdmin);

// ===== OTA MANAGEMENT =====

// GET /channels/otas — list all connected OTAs
router.get('/otas', async (req, res) => {
  const otas = await pb.collection('channel_otas').getFullList({
    sort: 'name',
    $autoCancel: false,
  });
  res.json({ otas });
});

// POST /channels/otas — add a new OTA channel
router.post('/otas', async (req, res) => {
  const { name, ota_code, hotel_id_on_ota, api_username, api_password, api_key, commission_rate, currency } = req.body;
  if (!name || !ota_code) {
    return res.status(400).json({ error: 'name and ota_code are required' });
  }

  const record = await pb.collection('channel_otas').create({
    name, ota_code,
    hotel_id_on_ota: hotel_id_on_ota || '',
    api_username: api_username || '', api_password: api_password || '', api_key: api_key || '',
    webhook_url: '',
    connection_status: 'pending',
    is_active: true,
    commission_rate: commission_rate || '',
    currency: currency || 'EUR',
    auto_sync: true,
    sync_interval_minutes: 15,
  });
  res.json({ success: true, ota: record });
});

// PUT /channels/otas/:id — update OTA config
router.put('/otas/:id', async (req, res) => {
  const { id } = req.params;
  const { api_username, api_password, api_key, hotel_id_on_ota, is_active, auto_sync, sync_interval_minutes } = req.body;
  const updateData = {};
  if (api_username !== undefined) updateData.api_username = api_username;
  if (api_password !== undefined) updateData.api_password = api_password;
  if (api_key !== undefined) updateData.api_key = api_key;
  if (hotel_id_on_ota !== undefined) updateData.hotel_id_on_ota = hotel_id_on_ota;
  if (is_active !== undefined) updateData.is_active = is_active;
  if (auto_sync !== undefined) updateData.auto_sync = auto_sync;
  if (sync_interval_minutes !== undefined) updateData.sync_interval_minutes = sync_interval_minutes;
  await pb.collection('channel_otas').update(id, updateData);
  res.json({ success: true, message: 'OTA updated' });
});

// ===== ROOM MAPPINGS =====

// GET /channels/otas/:otaId/mappings — get room type mappings for an OTA
router.get('/otas/:otaId/mappings', async (req, res) => {
  const { otaId } = req.params;
  const mappings = await pb.collection('channel_room_mappings').getFullList({
    filter: `ota_id = "${otaId}"`,
    $autoCancel: false,
  });

  // Get our room types to show available options
  let roomTypes = [];
  try {
    roomTypes = await pb.collection('room_types').getFullList({ $autoCancel: false });
  } catch (e) { /* collection may not exist yet */ }

  res.json({ mappings, room_types: roomTypes });
});

// POST /channels/otas/:otaId/mappings — map a room type to OTA's room
router.post('/otas/:otaId/mappings', async (req, res) => {
  const { otaId } = req.params;
  const { room_type_id, ota_room_code, ota_rate_plan_code, ota_capacity, price_markup_percent } = req.body;
  if (!room_type_id || !ota_room_code) {
    return res.status(400).json({ error: 'room_type_id and ota_room_code are required' });
  }

  const record = await pb.collection('channel_room_mappings').create({
    ota_id: otaId, room_type_id, ota_room_code,
    ota_rate_plan_code: ota_rate_plan_code || '',
    ota_capacity: ota_capacity || 2,
    price_markup_percent: price_markup_percent || 0,
    is_active: true,
  });
  res.json({ success: true, mapping: record });
});

// ===== RATE & AVAILABILITY PUSH =====

// POST /channels/otas/:otaId/push-rates — push rates and availability to OTA
router.post('/otas/:otaId/push-rates', async (req, res) => {
  const { otaId } = req.params;
  const { updates } = req.body;
  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required' });
  }

  const ota = await pb.collection('channel_otas').getOne(otaId);
  if (ota.connection_status !== 'connected') {
    return res.status(400).json({ error: 'OTA is not connected. Connect first.' });
  }

  // Mark as syncing
  await pb.collection('channel_otas').update(otaId, { sync_status: 'syncing' });

  let successCount = 0;
  let failCount = 0;

  for (const update of updates) {
    try {
      // Log the rate update
      await pb.collection('channel_rate_updates').create({
        ota_id: otaId,
        room_type_id: update.room_type_id || '',
        stay_date: update.date,
        price: update.price || 0,
        available: update.available || 0,
        min_stay: update.min_stay || 1,
        max_stay: update.max_stay || 0,
        closed_to_arrival: update.closed_to_arrival || false,
        closed_to_departure: update.closed_to_departure || false,
        update_type: 'push',
        status: 'success',
        pushed_at: new Date().toISOString(),
      }, { $autoCancel: false });
      successCount++;
    } catch (e) {
      await pb.collection('channel_rate_updates').create({
        ota_id: otaId,
        room_type_id: update.room_type_id || '',
        stay_date: update.date,
        status: 'failed',
        error_message: e.message,
        pushed_at: new Date().toISOString(),
      }, { $autoCancel: false });
      failCount++;
    }
  }

  // Mark sync complete
  await pb.collection('channel_otas').update(otaId, {
    sync_status: 'synced',
    last_sync: new Date().toISOString(),
  });

  logger.info(`Rate push to ${ota.name}: ${successCount} success, ${failCount} failed`);
  res.json({ success: true, pushed: successCount, failed: failCount });
});

// ===== BOOKING PULL =====

// GET /channels/otas/:otaId/bookings — pull new bookings from OTA
router.get('/otas/:otaId/bookings', async (req, res) => {
  const { otaId } = req.params;
  const { status } = req.query;

  const filter = `ota_id = "${otaId}"${status ? ` && status = "${status}"` : ' && is_imported = false'}`;
  const bookings = await pb.collection('channel_bookings').getList(1, 100, {
    filter,
    sort: '-ota_created_at',
    $autoCancel: false,
  });
  res.json({ bookings: bookings.items, total: bookings.totalItems });
});

// POST /channels/otas/:otaId/import-booking/:bookingId — import an OTA booking into our system
router.post('/otas/:otaId/import-booking/:channelBookingId', async (req, res) => {
  const { otaId, channelBookingId } = req.params;

  const channelBooking = await pb.collection('channel_bookings').getOne(channelBookingId);

  if (channelBooking.is_imported) {
    return res.status(400).json({ error: 'Booking already imported' });
  }

  // Create booking in our bookings collection
  const booking = await pb.collection('bookings').create({
    guest_name: channelBooking.guest_name || 'OTA Guest',
    guest_email: channelBooking.guest_email || '',
    guest_phone: channelBooking.guest_phone || '',
    check_in_date: channelBooking.check_in,
    check_out_date: channelBooking.check_out,
    accommodationType: channelBooking.room_type || 'Standard',
    room_type: channelBooking.room_type || 'Standard',
    number_of_guests: (channelBooking.num_adults || 1) + (channelBooking.num_children || 0),
    num_adults: channelBooking.num_adults || 1,
    num_children: channelBooking.num_children || 0,
    final_price: channelBooking.total_price || 0,
    booking_source: channelBooking.ota_id,
    booking_status: 'confirmed',
    payment_status: channelBooking.payment_method === 'OTA_collect' ? 'paid_by_ota' : 'pending',
    channel_booking_id: channelBooking.ota_booking_id,
    channel_name: channelBooking.ota_id,
    terms_accepted: true,
  }, { $autoCancel: false });

  // Mark OTA booking as imported
  await pb.collection('channel_bookings').update(channelBookingId, {
    is_imported: true,
    booking_id: booking.id,
    imported_at: new Date().toISOString(),
    status: 'imported',
  });

  logger.info(`Imported OTA booking ${channelBooking.ota_booking_id} -> booking ${booking.id}`);
  res.json({ success: true, booking_id: booking.id });
});

// ===== WEBHOOK (OTA -> our system) =====
// POST /channels/webhook/:otaCode — receive webhooks from OTAs (no auth — public endpoint)
router.post('/webhook/:otaCode', express.raw({ type: 'application/json' }), async (req, res) => {
  const { otaCode } = req.params;

  let ota;
  try {
    ota = await pb.collection('channel_otas').getFirstListItem(`ota_code = "${otaCode}"`);
  } catch (e) {
    logger.warn(`Webhook from unknown OTA: ${otaCode}`);
    return res.status(404).json({ error: 'Unknown OTA' });
  }

  // Parse the webhook payload (each OTA has different format)
  let payload;
  try {
    payload = JSON.parse(req.body.toString());
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON' });
  }

  // Store the booking/cancellation/modification
  if (payload.reservation_id || payload.booking_id) {
    await pb.collection('channel_bookings').create({
      ota_id: ota.id,
      ota_booking_id: payload.reservation_id || payload.booking_id,
      guest_name: payload.guest_name || payload.guest?.first_name || 'Unknown',
      guest_email: payload.guest_email || payload.guest?.email || '',
      guest_phone: payload.guest_phone || payload.guest?.phone || '',
      guest_country: payload.guest_country || payload.guest?.country || '',
      check_in: payload.check_in || payload.start_date,
      check_out: payload.check_out || payload.end_date,
      room_type: payload.room_type || payload.room?.name || '',
      num_adults: payload.num_adults || payload.adults || 1,
      num_children: payload.num_children || payload.children || 0,
      total_price: payload.total_price || payload.amount || 0,
      currency: payload.currency || 'EUR',
      commission: payload.commission || 0,
      payment_method: payload.payment_method || 'OTA_collect',
      status: payload.action === 'cancel' ? 'cancelled_by_ota' : 'new',
      special_requests: payload.special_requests || payload.notes || '',
      ota_created_at: payload.created_at || new Date().toISOString(),
      is_imported: false,
    }, { $autoCancel: false });

    logger.info(`Webhook: New ${otaCode} booking received: ${payload.reservation_id || payload.booking_id}`);
  }

  res.json({ received: true });
});

// ===== DASHBOARD =====

// GET /channels/dashboard — channel manager overview
router.get('/dashboard', async (req, res) => {
  const { from, to } = req.query;
  const dateFrom = from || new Date().toISOString().split('T')[0];
  const dateTo = to || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const otas = await pb.collection('channel_otas').getFullList({
    filter: 'is_active = true', $autoCancel: false,
  });

  const channelBookings = await pb.collection('channel_bookings').getFullList({
    filter: `ota_created_at >= "${dateFrom}" && ota_created_at <= "${dateTo}"`,
    $autoCancel: false,
  });

  // Group by OTA
  const perOta = {};
  for (const b of channelBookings) {
    const otaName = otas.find(o => o.id === b.ota_id)?.name || 'Unknown';
    if (!perOta[otaName]) perOta[otaName] = { bookings: 0, revenue: 0, pending_import: 0 };
    perOta[otaName].bookings++;
    perOta[otaName].revenue += (b.total_price || 0);
    if (!b.is_imported) perOta[otaName].pending_import++;
  }

  res.json({
    connected_otas: otas.filter(o => o.connection_status === 'connected').length,
    total_otas: otas.length,
    pending_imports: channelBookings.filter(b => !b.is_imported).length,
    per_ota: perOta,
  });
});

export default router;
