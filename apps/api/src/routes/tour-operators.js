import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All tour operator routes require admin auth
router.use(authMiddleware, requireAdmin);

// ===== TOUR OPERATORS =====

// GET /tour-operators
router.get('/', async (req, res) => {
  const operators = await pb.collection('tour_operators').getFullList({
    filter: 'is_active = true',
    sort: 'name',
    $autoCancel: false,
  });
  res.json({ tour_operators: operators });
});

// POST /tour-operators
router.post('/', async (req, res) => {
  const { name, country, contact_name, contact_email, contact_phone, eik, vat_number,
    commission_rate, billing_cycle, currency } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const record = await pb.collection('tour_operators').create({
    name, country: country || '', contact_name: contact_name || '',
    contact_email: contact_email || '', contact_phone: contact_phone || '',
    eik: eik || '', vat_number: vat_number || '',
    commission_rate: commission_rate || 0, billing_cycle: billing_cycle || 'monthly',
    currency: currency || 'EUR', is_active: true,
  });
  res.json({ success: true, tour_operator: record });
});

// PUT /tour-operators/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  await pb.collection('tour_operators').update(id, updates);
  res.json({ success: true, message: 'Tour operator updated' });
});

// ===== CONTRACTS =====

// GET /tour-operators/:operatorId/contracts
router.get('/:operatorId/contracts', async (req, res) => {
  const { operatorId } = req.params;
  const contracts = await pb.collection('to_contracts').getFullList({
    filter: `tour_operator_id = "${operatorId}"`,
    sort: '-season_start',
    $autoCancel: false,
  });
  res.json({ contracts });
});

// POST /tour-operators/:operatorId/contracts
router.post('/:operatorId/contracts', async (req, res) => {
  const { operatorId } = req.params;
  const { season_start, season_end, board_type, allotment_rooms, release_days,
    payment_terms, deposit_percent, child_discount_percent, early_booking_discount,
    promotion_rules_json } = req.body;

  if (!season_start || !season_end) {
    return res.status(400).json({ error: 'season_start and season_end are required' });
  }

  const record = await pb.collection('to_contracts').create({
    tour_operator_id: operatorId,
    season_start, season_end,
    status: 'draft',
    board_type: board_type || 'BB',
    allotment_rooms: allotment_rooms || 0,
    release_days: release_days || 45,
    rate_structure_json: '',
    child_discount_percent: child_discount_percent || 0,
    early_booking_discount: early_booking_discount || 0,
    promotion_rules_json: promotion_rules_json || '{}',
    payment_terms: payment_terms || 'post_stay',
    deposit_percent: deposit_percent || 0,
    signed_date: null, signed_by: '',
  });
  res.json({ success: true, contract: record });
});

// PUT /tour-operators/contracts/:contractId/activate
router.put('/contracts/:contractId/activate', async (req, res) => {
  const { contractId } = req.params;
  await pb.collection('to_contracts').update(contractId, { status: 'active' });
  logger.info(`Contract ${contractId} activated`);
  res.json({ success: true, message: 'Contract activated' });
});

// ===== CONTRACT RATES =====

// POST /tour-operators/contracts/:contractId/rates
router.post('/contracts/:contractId/rates', async (req, res) => {
  const { contractId } = req.params;
  const { room_type_id, season_name, date_from, date_to, adult_rate, child_rate,
    single_supplement, third_bed_discount, board_supplement_hb, board_supplement_fb } = req.body;

  if (!room_type_id || !date_from || !date_to || adult_rate === undefined) {
    return res.status(400).json({ error: 'room_type_id, date_from, date_to, adult_rate are required' });
  }

  const record = await pb.collection('to_contract_rates').create({
    contract_id: contractId, room_type_id, season_name: season_name || 'Standard',
    date_from, date_to,
    adult_rate: Number(adult_rate), child_rate: Number(child_rate || 0),
    single_supplement: Number(single_supplement || 0), third_bed_discount: Number(third_bed_discount || 0),
    board_supplement_bb: 0, board_supplement_hb: Number(board_supplement_hb || 0),
    board_supplement_fb: Number(board_supplement_fb || 0),
    currency: 'EUR',
  });
  res.json({ success: true, rate: record });
});

// GET /tour-operators/contracts/:contractId/rates
router.get('/contracts/:contractId/rates', async (req, res) => {
  const { contractId } = req.params;
  const rates = await pb.collection('to_contract_rates').getFullList({
    filter: `contract_id = "${contractId}"`,
    sort: 'date_from',
    $autoCancel: false,
  });
  res.json({ rates });
});

// ===== ALLOTMENTS =====

// GET /tour-operators/contracts/:contractId/allotments
router.get('/contracts/:contractId/allotments', async (req, res) => {
  const { contractId } = req.params;
  const allotments = await pb.collection('to_allotments').getFullList({
    filter: `contract_id = "${contractId}"`,
    sort: 'month',
    $autoCancel: false,
  });
  res.json({ allotments });
});

// POST /tour-operators/contracts/:contractId/allotments
router.post('/contracts/:contractId/allotments', async (req, res) => {
  const { contractId } = req.params;
  const { month, allocated_rooms, release_date } = req.body;
  if (!month || allocated_rooms === undefined) {
    return res.status(400).json({ error: 'month and allocated_rooms are required' });
  }

  // Get contract to find tour operator
  const contract = await pb.collection('to_contracts').getOne(contractId);

  const record = await pb.collection('to_allotments').create({
    contract_id: contractId, tour_operator_id: contract.tour_operator_id,
    month, allocated_rooms: Number(allocated_rooms), sold_rooms: 0,
    available_rooms: Number(allocated_rooms), pickup_percent: 0,
    release_date: release_date || null, is_released: false,
  });
  res.json({ success: true, allotment: record });
});

// PUT /tour-operators/allotments/:id/release
router.put('/allotments/:id/release', async (req, res) => {
  const { id } = req.params;
  const allotment = await pb.collection('to_allotments').getOne(id);
  const unsold = (allotment.allocated_rooms || 0) - (allotment.sold_rooms || 0);

  await pb.collection('to_allotments').update(id, {
    is_released: true,
    available_rooms: 0,
  });

  logger.info(`Released ${unsold} unsold rooms from allotment ${id} back to free sale`);
  res.json({ success: true, released_rooms: unsold });
});

// ===== ROOMING LISTS =====

// POST /tour-operators/rooming-lists — import guest names for group bookings
router.post('/rooming-lists', async (req, res) => {
  const { contract_id, tour_operator_id, group_name, arrival_date, departure_date, guests } = req.body;
  if (!contract_id || !tour_operator_id || !guests || !Array.isArray(guests)) {
    return res.status(400).json({ error: 'contract_id, tour_operator_id, and guests array are required' });
  }

  const record = await pb.collection('to_rooming_lists').create({
    contract_id, tour_operator_id,
    group_name: group_name || 'Unnamed Group',
    arrival_date, departure_date,
    total_guests: guests.length,
    total_rooms: Math.ceil(guests.length / 2),
    status: 'imported',
    guests_json: JSON.stringify(guests),
    imported_at: new Date().toISOString(),
  });

  // Create individual bookings from the rooming list
  for (const guest of guests) {
    try {
      const booking = await pb.collection('bookings').create({
        guest_name: guest.name || 'Unknown',
        guest_email: guest.email || '',
        check_in_date: arrival_date,
        check_out_date: departure_date,
        accommodationType: guest.room_type || 'Standard',
        room_type: guest.room_type || 'Standard',
        number_of_guests: guest.guests_in_room || 2,
        booking_source: 'tour_operator',
        booking_status: 'confirmed',
        payment_status: 'contract',
        terms_accepted: true,
      }, { $autoCancel: false });

      // Create TO booking link
      await pb.collection('to_bookings').create({
        booking_id: booking.id,
        contract_id, tour_operator_id,
        to_reference: guest.to_reference || '',
        voucher_number: guest.voucher || '',
        arrival_date, departure_date,
        board_type: guest.board_type || 'BB',
        contracted_rate: guest.rate || 0,
        billing_status: 'pending',
      }, { $autoCancel: false });
    } catch (e) {
      logger.warn(`Failed to create booking for guest ${guest.name}: ${e.message}`);
    }
  }

  logger.info(`Rooming list imported: ${record.id}, ${guests.length} guests`);
  res.json({ success: true, rooming_list: record });
});

// ===== INVOICING =====

// POST /tour-operators/:operatorId/invoices — generate TO invoice from completed stays
router.post('/:operatorId/invoices', async (req, res) => {
  const { operatorId } = req.params;
  const { period_from, period_to, booking_ids } = req.body;

  if (!period_from || !period_to) {
    return res.status(400).json({ error: 'period_from and period_to are required' });
  }

  // Get all TO bookings in the period
  const toBookings = await pb.collection('to_bookings').getFullList({
    filter: `tour_operator_id = "${operatorId}" && billing_status = "pending"`,
    $autoCancel: false,
  });

  // Get the actual booking details for each
  let subtotal = 0;
  let commissionTotal = 0;
  const invoiceItems = [];

  for (const toBooking of toBookings) {
    try {
      const booking = await pb.collection('bookings').getOne(toBooking.booking_id);
      // Check if booking falls within the period
      if (booking.check_in_date >= period_from && booking.check_out_date <= period_to) {
        const rate = toBooking.contracted_rate || booking.final_price || 0;
        const commission = rate * ((await pb.collection('tour_operators').getOne(operatorId)).commission_rate || 0) / 100;
        const net = rate - commission;
        subtotal += rate;
        commissionTotal += commission;

        invoiceItems.push({
          guest_name: booking.guest_name,
          check_in: booking.check_in_date,
          check_out: booking.check_out_date,
          room_type: booking.accommodationType || booking.room_type,
          rate, commission, net,
          booking_id: booking.id,
        });
      }
    } catch (e) {
      logger.warn(`Could not fetch booking ${toBooking.booking_id}`);
    }
  }

  // Generate invoice number
  let nextNumber = 'TO-0000001';
  try {
    const lastInvoice = await pb.collection('to_invoices').getList(1, 1, {
      sort: '-invoice_number', $autoCancel: false,
    });
    if (lastInvoice.items.length > 0 && lastInvoice.items[0].invoice_number) {
      const num = parseInt(lastInvoice.items[0].invoice_number.replace('TO-', '')) + 1;
      nextNumber = `TO-${String(num).padStart(7, '0')}`;
    }
  } catch (e) { /* first invoice */ }

  const vatRate = 20;
  const netTotal = subtotal - commissionTotal;
  const vatAmount = netTotal * (vatRate / 100);
  const total = netTotal + vatAmount;

  const invoice = await pb.collection('to_invoices').create({
    invoice_number: nextNumber,
    tour_operator_id: operatorId,
    invoice_date: new Date().toISOString().split('T')[0],
    period_from, period_to,
    items_json: JSON.stringify(invoiceItems),
    subtotal: Number(subtotal.toFixed(2)),
    vat_rate: vatRate,
    vat_amount: Number(vatAmount.toFixed(2)),
    commission_total: Number(commissionTotal.toFixed(2)),
    net_total: Number(netTotal.toFixed(2)),
    total: Number(total.toFixed(2)),
    currency: 'EUR',
    status: 'issued',
    booking_ids_json: JSON.stringify(invoiceItems.map(i => i.booking_id)),
  });

  // Mark TO bookings as invoiced
  for (const item of invoiceItems) {
    await pb.collection('to_bookings').update(
      (await pb.collection('to_bookings').getFirstListItem(`booking_id = "${item.booking_id}"`)).id,
      { billing_status: 'invoiced', to_invoice_number: nextNumber }
    );
  }

  logger.info(`TO invoice ${nextNumber} created for operator ${operatorId} — €${total.toFixed(2)}`);
  res.json({ success: true, invoice, line_items: invoiceItems.length });
});

// GET /tour-operators/invoices — list all TO invoices
router.get('/invoices', async (req, res) => {
  const invoices = await pb.collection('to_invoices').getList(1, 50, {
    sort: '-invoice_date',
    $autoCancel: false,
  });
  res.json({ invoices: invoices.items });
});

export default router;
