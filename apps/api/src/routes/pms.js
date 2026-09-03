import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All PMS routes require admin auth
router.use(authMiddleware, requireAdmin);

// GET /pms/calendar?from=2026-09-01&to=2026-09-30
// Returns bookings for the date range, formatted for calendar display
router.get('/calendar', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query params are required (YYYY-MM-DD)' });
  }

  // Get all bookings that overlap with the date range
  const bookings = await pb.collection('bookings').getFullList({
    filter: `check_in_date <= "${to}" && check_out_date >= "${from}"`,
    sort: 'check_in_date',
    $autoCancel: false,
  });

  // Get all rooms for the Y-axis
  let rooms = [];
  try {
    rooms = await pb.collection('rooms').getFullList({
      sort: 'name',
      $autoCancel: false,
    });
  } catch (e) {
    logger.warn('No rooms collection or empty, returning bookings only');
  }

  // Color-code bookings by source
  const colorMap = {
    direct: '#3b82f6',       // blue
    'booking.com': '#1e40af', // dark blue
    agoda: '#b45309',         // amber
    expedia: '#7c3aed',       // purple
    tripadvisor: '#0891b2',   // cyan
    phone: '#16a34a',         // green
    walk_in: '#dc2626',       // red
  };

  const formattedBookings = bookings.map(b => ({
    id: b.id,
    guest_name: b.guest_name || 'Unknown',
    guest_email: b.guest_email || '',
    check_in: b.check_in_date,
    check_out: b.check_out_date,
    room_type: b.accommodationType || b.room_type || 'Unassigned',
    assigned_room: b.assigned_room_id || null,
    booking_status: b.booking_status || 'confirmed',
    booking_source: b.booking_source || 'direct',
    payment_status: b.payment_status || 'pending',
    color: b.color || colorMap[b.booking_source || 'direct'] || '#3b82f6',
    num_guests: b.number_of_guests || 1,
    final_price: b.final_price || 0,
    notes: b.notes || '',
  }));

  res.json({
    rooms: rooms.map(r => ({
      id: r.id,
      name: r.name,
      room_number: r.room_number || r.name,
      floor: r.floor || 1,
      room_type: r.room_type_id || null,
      status: r.room_status || 'active',
      housekeeping_status: r.housekeeping_status || 'clean',
    })),
    bookings: formattedBookings,
    date_range: { from, to },
  });
});

// GET /pms/room-scheme
// Returns floor plan with current occupancy status for each room
router.get('/room-scheme', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  // Get all rooms
  let rooms = [];
  try {
    rooms = await pb.collection('rooms').getFullList({
      sort: 'floor,room_number',
      $autoCancel: false,
    });
  } catch (e) {
    return res.json({ floors: [], rooms: [] });
  }

  // Get bookings that are currently active (checked in or arriving today)
  const activeBookings = await pb.collection('bookings').getFullList({
    filter: `check_in_date <= "${today}" && check_out_date >= "${today}" && booking_status != "cancelled"`,
    $autoCancel: false,
  });

  // Map bookings to rooms
  const roomBookingMap = {};
  for (const booking of activeBookings) {
    if (booking.assigned_room_id) {
      roomBookingMap[booking.assigned_room_id] = {
        booking_id: booking.id,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        check_in: booking.check_in_date,
        check_out: booking.check_out_date,
        booking_status: booking.booking_status || 'confirmed',
        final_price: booking.final_price || 0,
        booking_source: booking.booking_source || 'direct',
      };
    }
  }

  // Group rooms by floor
  const floorsMap = {};
  for (const room of rooms) {
    const floor = room.floor || 1;
    if (!floorsMap[floor]) floorsMap[floor] = [];

    const isOccupied = !!roomBookingMap[room.id];
    const isArrivingToday = roomBookingMap[room.id]?.check_in === today;
    const isDepartingToday = roomBookingMap[room.id]?.check_out === today;

    let displayStatus = 'available';
    if (room.room_status === 'maintenance') {
      displayStatus = 'maintenance';
    } else if (isOccupied && isArrivingToday) {
      displayStatus = 'arriving';
    } else if (isOccupied && isDepartingToday) {
      displayStatus = 'departing';
    } else if (isOccupied) {
      displayStatus = 'occupied';
    } else if (room.housekeeping_status === 'dirty') {
      displayStatus = 'dirty';
    }

    floorsMap[floor].push({
      id: room.id,
      room_number: room.room_number || room.name,
      floor: floor,
      room_type: room.room_type_id || null,
      view_type: room.view_type || null,
      status: displayStatus,
      housekeeping_status: room.housekeeping_status || 'clean',
      current_booking: roomBookingMap[room.id] || null,
      position_x: room.position_x || null,
      position_y: room.position_y || null,
    });
  }

  const floors = Object.keys(floorsMap).sort((a, b) => a - b).map(f => ({
    floor: parseInt(f),
    rooms: floorsMap[f],
  }));

  res.json({ floors, today });
});

// GET /pms/front-desk/today
// Returns today's arrivals, departures, and in-house guests
router.get('/front-desk/today', async (req, res) => {
  const today = new Date().toISOString().split('T')[0];

  const [arrivals, departures, inHouse] = await Promise.all([
    pb.collection('bookings').getFullList({
      filter: `check_in_date = "${today}" && booking_status != "cancelled"`,
      $autoCancel: false,
    }),
    pb.collection('bookings').getFullList({
      filter: `check_out_date = "${today}" && booking_status != "cancelled"`,
      $autoCancel: false,
    }),
    pb.collection('bookings').getFullList({
      filter: `check_in_date <= "${today}" && check_out_date > "${today}" && booking_status = "checked_in"`,
      $autoCancel: false,
    }),
  ]);

  const formatBooking = (b) => ({
    id: b.id,
    guest_name: b.guest_name,
    guest_email: b.guest_email,
    guest_phone: b.guest_phone || '',
    room_type: b.accommodationType || b.room_type,
    assigned_room_id: b.assigned_room_id || null,
    check_in: b.check_in_date,
    check_out: b.check_out_date,
    booking_status: b.booking_status || 'confirmed',
    booking_source: b.booking_source || 'direct',
    payment_status: b.payment_status || 'pending',
    final_price: b.final_price || 0,
    num_guests: b.number_of_guests || 1,
    num_adults: b.num_adults || 0,
    num_children: b.num_children || 0,
    notes: b.notes || '',
  });

  res.json({
    date: today,
    arrivals: arrivals.map(formatBooking),
    departures: departures.map(formatBooking),
    in_house: inHouse.map(formatBooking),
    summary: {
      arrivals_count: arrivals.length,
      departures_count: departures.length,
      in_house_count: inHouse.length,
    },
  });
});

// PUT /pms/bookings/:id/assign-room
// Assign a physical room to a booking
router.put('/bookings/:id/assign-room', async (req, res) => {
  const { id } = req.params;
  const { room_id } = req.body;

  if (!room_id) {
    return res.status(400).json({ error: 'room_id is required' });
  }

  // Verify room exists
  const room = await pb.collection('rooms').getOne(room_id);

  // Check for conflicts — any other booking assigned to this room during overlapping dates
  const booking = await pb.collection('bookings').getOne(id);

  const conflicts = await pb.collection('bookings').getList(1, 1, {
    filter: `id != "${id}" && assigned_room_id = "${room_id}" && check_in_date < "${booking.check_out_date}" && check_out_date > "${booking.check_in_date}" && booking_status != "cancelled"`,
    $autoCancel: false,
  });

  if (conflicts.totalItems > 0) {
    return res.status(409).json({ error: 'Room is already assigned to another booking during this period' });
  }

  await pb.collection('bookings').update(id, {
    assigned_room_id: room_id,
  });

  logger.info(`Room ${room.name} assigned to booking ${id}`);
  res.json({ success: true, message: 'Room assigned successfully' });
});

// PUT /pms/bookings/:id/dates
// Extend or shorten a booking's stay
router.put('/bookings/:id/dates', async (req, res) => {
  const { id } = req.params;
  const { check_in_date, check_out_date } = req.body;

  if (!check_in_date && !check_out_date) {
    return res.status(400).json({ error: 'At least one date is required' });
  }

  const booking = await pb.collection('bookings').getOne(id);

  const newCheckIn = check_in_date || booking.check_in_date;
  const newCheckOut = check_out_date || booking.check_out_date;

  // Validate dates
  if (new Date(newCheckOut) <= new Date(newCheckIn)) {
    return res.status(400).json({ error: 'Check-out date must be after check-in date' });
  }

  // Check room conflict if room is assigned
  if (booking.assigned_room_id) {
    const conflicts = await pb.collection('bookings').getList(1, 1, {
      filter: `id != "${id}" && assigned_room_id = "${booking.assigned_room_id}" && check_in_date < "${newCheckOut}" && check_out_date > "${newCheckIn}" && booking_status != "cancelled"`,
      $autoCancel: false,
    });

    if (conflicts.totalItems > 0) {
      return res.status(409).json({ error: 'Room is not available for the extended dates' });
    }
  }

  const updateData = {};
  if (check_in_date) updateData.check_in_date = check_in_date;
  if (check_out_date) updateData.check_out_date = check_out_date;

  await pb.collection('bookings').update(id, updateData);

  logger.info(`Booking ${id} dates updated: ${newCheckIn} to ${newCheckOut}`);
  res.json({ success: true, message: 'Booking dates updated' });
});

// POST /pms/bookings/:id/check-in
// Check in a guest
router.post('/bookings/:id/check-in', async (req, res) => {
  const { id } = req.params;

  const booking = await pb.collection('bookings').getOne(id);

  if (booking.booking_status === 'checked_in') {
    return res.status(400).json({ error: 'Guest is already checked in' });
  }

  if (booking.booking_status === 'cancelled') {
    return res.status(400).json({ error: 'Cannot check in a cancelled booking' });
  }

  await pb.collection('bookings').update(id, {
    booking_status: 'checked_in',
    check_in_time: new Date().toISOString(),
  });

  // Update room housekeeping status if assigned
  if (booking.assigned_room_id) {
    try {
      await pb.collection('rooms').update(booking.assigned_room_id, {
        housekeeping_status: 'occupied',
      });
    } catch (e) {
      logger.warn(`Could not update room status for room ${booking.assigned_room_id}`);
    }
  }

  logger.info(`Guest checked in for booking ${id}`);
  res.json({ success: true, message: 'Guest checked in successfully' });
});

// POST /pms/bookings/:id/check-out
// Check out a guest
router.post('/bookings/:id/check-out', async (req, res) => {
  const { id } = req.params;

  const booking = await pb.collection('bookings').getOne(id);

  if (booking.booking_status !== 'checked_in') {
    return res.status(400).json({ error: 'Guest is not checked in' });
  }

  await pb.collection('bookings').update(id, {
    booking_status: 'checked_out',
    check_out_time: new Date().toISOString(),
  });

  // Update room housekeeping status
  if (booking.assigned_room_id) {
    try {
      await pb.collection('rooms').update(booking.assigned_room_id, {
        housekeeping_status: 'dirty',
      });
    } catch (e) {
      logger.warn(`Could not update room status for room ${booking.assigned_room_id}`);
    }
  }

  logger.info(`Guest checked out for booking ${id}`);
  res.json({ success: true, message: 'Guest checked out successfully' });
});

// GET /pms/bookings/:id/folios
// Get all folios for a booking
router.get('/bookings/:id/folios', async (req, res) => {
  const { id } = req.params;

  const folios = await pb.collection('folios').getFullList({
    filter: `booking_id = "${id}"`,
    $autoCancel: false,
  });

  // Get charges and payments for each folio
  const foliosWithDetails = await Promise.all(
    folios.map(async (folio) => {
      const [charges, payments] = await Promise.all([
        pb.collection('charges').getFullList({
          filter: `folio_id = "${folio.id}"`,
          $autoCancel: false,
        }),
        pb.collection('payments').getFullList({
          filter: `folio_id = "${folio.id}"`,
          $autoCancel: false,
        }),
      ]);

      return {
        ...folio,
        charges,
        payments,
        charge_count: charges.length,
        payment_count: payments.length,
        computed_balance: (folio.total_charges || 0) - (folio.total_payments || 0),
      };
    })
  );

  res.json({ folios: foliosWithDetails });
});

// POST /pms/bookings/:id/folios
// Create a new folio for a booking (e.g. split the bill)
router.post('/bookings/:id/folios', async (req, res) => {
  const { id } = req.params;
  const { folio_type, name, email } = req.body;

  if (!folio_type) {
    return res.status(400).json({ error: 'folio_type is required' });
  }

  const record = await pb.collection('folios').create({
    booking_id: id,
    folio_type,
    name: name || 'New Folio',
    email: email || '',
    total_charges: 0,
    total_payments: 0,
    balance: 0,
    status: 'open',
  });

  // Update booking's folio count
  const booking = await pb.collection('bookings').getOne(id);
  const currentFolios = booking.num_folios || 1;
  await pb.collection('bookings').update(id, {
    num_folios: currentFolios + 1,
  });

  logger.info(`Folio ${record.id} created for booking ${id}`);
  res.json({ success: true, folio: record });
});

// POST /pms/folios/:folioId/charges
// Add a charge to a folio
router.post('/folios/:folioId/charges', async (req, res) => {
  const { folioId } = req.params;
  const { description, amount, charge_type, quantity, unit_price } = req.body;

  if (!description || amount === undefined) {
    return res.status(400).json({ error: 'description and amount are required' });
  }

  const folio = await pb.collection('folios').getOne(folioId);

  const charge = await pb.collection('charges').create({
    folio_id: folioId,
    booking_id: folio.booking_id,
    description,
    amount,
    charge_type: charge_type || 'service',
    charge_date: new Date().toISOString().split('T')[0],
    quantity: quantity || 1,
    unit_price: unit_price || amount,
    posted_automatically: false,
  });

  // Recalculate folio totals
  const allCharges = await pb.collection('charges').getFullList({
    filter: `folio_id = "${folioId}"`,
    $autoCancel: false,
  });
  const newTotal = allCharges.reduce((sum, c) => sum + (c.amount || 0), 0);

  await pb.collection('folios').update(folioId, {
    total_charges: newTotal,
    balance: newTotal - (folio.total_payments || 0),
  });

  logger.info(`Charge ${charge.id} added to folio ${folioId}`);
  res.json({ success: true, charge, new_total: newTotal });
});

// POST /pms/folios/:folioId/payments
// Record a payment on a folio
router.post('/folios/:folioId/payments', async (req, res) => {
  const { folioId } = req.params;
  const { amount, payment_method, payment_method_id, reference } = req.body;

  if (!amount || !payment_method) {
    return res.status(400).json({ error: 'amount and payment_method are required' });
  }

  const folio = await pb.collection('folios').getOne(folioId);

  const payment = await pb.collection('payments').create({
    folio_id: folioId,
    booking_id: folio.booking_id,
    amount,
    payment_method,
    payment_method_id: payment_method_id || '',
    payment_date: new Date().toISOString().split('T')[0],
    reference: reference || '',
    status: 'completed',
    processed_by: req.user?.id || '',
  });

  // Recalculate folio totals
  const allPayments = await pb.collection('payments').getFullList({
    filter: `folio_id = "${folioId}"`,
    $autoCancel: false,
  });
  const newTotalPayments = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const newBalance = (folio.total_charges || 0) - newTotalPayments;
  const newStatus = newBalance <= 0 ? 'settled' : 'open';

  await pb.collection('folios').update(folioId, {
    total_payments: newTotalPayments,
    balance: newBalance,
    status: newStatus,
  });

  logger.info(`Payment ${payment.id} recorded on folio ${folioId}`);
  res.json({ success: true, payment, new_balance: newBalance, folio_status: newStatus });
});

// GET /pms/payment-methods
router.get('/payment-methods', async (req, res) => {
  const methods = await pb.collection('payment_methods').getFullList({
    filter: 'is_active = true',
    sort: 'sort_order',
    $autoCancel: false,
  });

  res.json({ payment_methods: methods });
});

// POST /pms/payment-methods
router.post('/payment-methods', async (req, res) => {
  const { name, type, icon, sort_order } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'name and type are required' });
  }

  const record = await pb.collection('payment_methods').create({
    name,
    type,
    is_active: true,
    icon: icon || '',
    sort_order: sort_order || 0,
  });

  res.json({ success: true, payment_method: record });
});

// PUT /pms/payment-methods/:id
router.put('/payment-methods/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, icon, sort_order, is_active } = req.body;

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (icon !== undefined) updateData.icon = icon;
  if (sort_order !== undefined) updateData.sort_order = sort_order;
  if (is_active !== undefined) updateData.is_active = is_active;

  await pb.collection('payment_methods').update(id, updateData);

  res.json({ success: true, message: 'Payment method updated' });
});

// GET /pms/analytics/overview
// Revenue, occupancy, ADR, RevPAR for a date range
router.get('/analytics/overview', async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: 'from and to query params are required' });
  }

  const bookings = await pb.collection('bookings').getFullList({
    filter: `check_in_date >= "${from}" && check_out_date <= "${to}" && booking_status != "cancelled"`,
    $autoCancel: false,
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.final_price || 0), 0);
  const totalRooms = bookings.length;

  // Calculate nights
  const totalNights = bookings.reduce((sum, b) => {
    const checkIn = new Date(b.check_in_date);
    const checkOut = new Date(b.check_out_date);
    const nights = Math.max(1, (checkOut - checkIn) / (1000 * 60 * 60 * 24));
    return sum + nights;
  }, 0);

  const adr = totalNights > 0 ? totalRevenue / totalNights : 0;
  const numDays = Math.max(1, (new Date(to) - new Date(from)) / (1000 * 60 * 60 * 24));
  const occupancyRate = totalRooms > 0 ? (totalNights / (totalRooms * numDays)) * 100 : 0;
  const revpar = totalRooms > 0 ? totalRevenue / (totalRooms * numDays) : 0;

  // Source breakdown
  const sourceBreakdown = {};
  for (const b of bookings) {
    const source = b.booking_source || 'direct';
    if (!sourceBreakdown[source]) {
      sourceBreakdown[source] = { count: 0, revenue: 0 };
    }
    sourceBreakdown[source].count++;
    sourceBreakdown[source].revenue += (b.final_price || 0);
  }

  res.json({
    date_range: { from, to },
    total_bookings: bookings.length,
    total_revenue: Number(totalRevenue.toFixed(2)),
    total_nights: Math.round(totalNights),
    adr: Number(adr.toFixed(2)),
    occupancy_rate: Number(occupancyRate.toFixed(1)),
    revpar: Number(revpar.toFixed(2)),
    source_breakdown: sourceBreakdown,
  });
});

export default router;
