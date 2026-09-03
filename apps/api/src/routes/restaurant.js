import 'dotenv/config';
import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All restaurant routes require admin auth
router.use(authMiddleware, requireAdmin);

// ===== MENU MANAGEMENT =====

// GET /restaurant/menu — full menu with categories
router.get('/menu', async (req, res) => {
  const categories = await pb.collection('restaurant_menu_categories').getFullList({
    filter: 'is_active = true',
    sort: 'sort_order',
    $autoCancel: false,
  });

  const items = await pb.collection('restaurant_menu_items').getFullList({
    filter: 'is_available = true',
    sort: 'sort_order',
    $autoCancel: false,
  });

  const menuWithItems = categories.map(cat => ({
    ...cat,
    items: items.filter(item => item.category_id === cat.id),
  }));

  res.json({ menu: menuWithItems });
});

// POST /restaurant/menu/categories
router.post('/menu/categories', async (req, res) => {
  const { name, name_bg, sort_order } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const record = await pb.collection('restaurant_menu_categories').create({
    name, name_bg: name_bg || '', sort_order: sort_order || 0, is_active: true,
  });
  res.json({ success: true, category: record });
});

// POST /restaurant/menu/items
router.post('/menu/items', async (req, res) => {
  const { category_id, name, name_bg, description, price, item_type, vat_rate } = req.body;
  if (!category_id || !name || price === undefined) {
    return res.status(400).json({ error: 'category_id, name, and price are required' });
  }

  const record = await pb.collection('restaurant_menu_items').create({
    category_id, name, name_bg: name_bg || '', description: description || '',
    price, currency: 'EUR', item_type: item_type || 'food',
    is_available: true, vat_rate: vat_rate || 20, sort_order: 0,
  });
  res.json({ success: true, item: record });
});

// PUT /restaurant/menu/items/:id
router.put('/menu/items/:id', async (req, res) => {
  const { id } = req.params;
  const { name, price, is_available, description } = req.body;
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = price;
  if (is_available !== undefined) updateData.is_available = is_available;
  if (description !== undefined) updateData.description = description;
  await pb.collection('restaurant_menu_items').update(id, updateData);
  res.json({ success: true, message: 'Menu item updated' });
});

// ===== TABLE MANAGEMENT =====

// GET /restaurant/tables
router.get('/tables', async (req, res) => {
  const tables = await pb.collection('restaurant_tables').getFullList({
    sort: 'floor,table_number',
    $autoCancel: false,
  });

  // Get active orders for each table
  const activeOrders = await pb.collection('restaurant_orders').getFullList({
    filter: 'status = "open" || status = "preparing" || status = "served"',
    $autoCancel: false,
  });

  const tablesWithStatus = tables.map(t => ({
    ...t,
    current_order: activeOrders.find(o => o.table_id === t.id) || null,
  }));

  res.json({ tables: tablesWithStatus });
});

// POST /restaurant/tables
router.post('/tables', async (req, res) => {
  const { table_number, capacity, floor, area } = req.body;
  if (!table_number || !capacity) {
    return res.status(400).json({ error: 'table_number and capacity are required' });
  }

  const record = await pb.collection('restaurant_tables').create({
    table_number, capacity, floor: floor || 1, area: area || 'indoor',
    status: 'available',
  });
  res.json({ success: true, table: record });
});

// ===== ORDERS =====

// POST /restaurant/orders — create a new order
router.post('/orders', async (req, res) => {
  const { table_id, booking_id, order_type, num_guests, items, server } = req.body;
  if (!order_type) return res.status(400).json({ error: 'order_type is required' });
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items array is required' });
  }

  // Calculate totals
  let subtotal = 0;
  let vatTotal = 0;
  const enrichedItems = items.map(item => {
    const lineTotal = (item.quantity || 1) * (item.unit_price || 0);
    const vatAmount = lineTotal * ((item.vat_rate || 20) / 100);
    subtotal += lineTotal;
    vatTotal += vatAmount;
    return { ...item, line_total: lineTotal, vat_amount: vatAmount };
  });

  const grandTotal = subtotal + vatTotal;

  const record = await pb.collection('restaurant_orders').create({
    table_id: table_id || '',
    booking_id: booking_id || '',
    folio_id: '',
    guest_name: '',
    order_type,
    status: 'open',
    total: Number(subtotal.toFixed(2)),
    vat_amount: Number(vatTotal.toFixed(2)),
    grand_total: Number(grandTotal.toFixed(2)),
    payment_method: '',
    invoice_number: '',
    server: server || '',
    notes: '',
    opened_at: new Date().toISOString(),
    closed_at: null,
    num_guests: num_guests || 1,
    items_json: JSON.stringify(enrichedItems),
  });

  // Update table status if dine-in
  if (table_id && order_type === 'dine_in') {
    try {
      await pb.collection('restaurant_tables').update(table_id, { status: 'occupied' });
    } catch (e) {
      logger.warn(`Could not update table status for ${table_id}`);
    }
  }

  logger.info(`Restaurant order ${record.id} created — €${grandTotal.toFixed(2)}`);
  res.json({ success: true, order: record });
});

// GET /restaurant/orders — list orders with optional status filter
router.get('/orders', async (req, res) => {
  const { status } = req.query;
  const filter = status ? `status = "${status}"` : '';
  const orders = await pb.collection('restaurant_orders').getList(1, 50, {
    filter,
    sort: '-opened_at',
    $autoCancel: false,
  });
  res.json({ orders: orders.items, totalPages: orders.totalPages, page: orders.page });
});

// POST /restaurant/orders/:id/close — close order and post payment
router.post('/orders/:id/close', async (req, res) => {
  const { id } = req.params;
  const { payment_method, booking_id, folio_id } = req.body;

  const order = await pb.collection('restaurant_orders').getOne(id);
  if (order.status === 'paid' || order.status === 'cancelled') {
    return res.status(400).json({ error: 'Order is already closed' });
  }

  await pb.collection('restaurant_orders').update(id, {
    status: 'paid',
    payment_method: payment_method || 'cash',
    closed_at: new Date().toISOString(),
  });

  // If charged to room (folio), create a charge on the folio
  if (payment_method === 'room_charge' && folio_id) {
    await pb.collection('charges').create({
      folio_id,
      booking_id: booking_id || order.booking_id,
      description: `Restaurant — ${order.order_type} — ${order.num_guests} guests`,
      amount: order.grand_total || order.total,
      charge_type: 'restaurant',
      charge_date: new Date().toISOString().split('T')[0],
      quantity: 1,
      unit_price: order.grand_total || order.total,
      posted_automatically: true,
    });

    // Recalculate folio totals
    const allCharges = await pb.collection('charges').getFullList({
      filter: `folio_id = "${folio_id}"`, $autoCancel: false,
    });
    const newTotal = allCharges.reduce((sum, c) => sum + (c.amount || 0), 0);
    const folio = await pb.collection('folios').getOne(folio_id);
    await pb.collection('folios').update(folio_id, {
      total_charges: newTotal,
      balance: newTotal - (folio.total_payments || 0),
    });
  }

  // Free up the table if dine-in
  if (order.table_id) {
    try {
      await pb.collection('restaurant_tables').update(order.table_id, { status: 'available' });
    } catch (e) {
      logger.warn(`Could not free table ${order.table_id}`);
    }
  }

  logger.info(`Restaurant order ${id} closed — ${payment_method}`);
  res.json({ success: true, message: 'Order closed successfully' });
});

// ===== RESERVATIONS =====

// GET /restaurant/reservations
router.get('/reservations', async (req, res) => {
  const { date } = req.query;
  const filter = date ? `reservation_date = "${date}"` : '';
  const reservations = await pb.collection('restaurant_reservations').getList(1, 50, {
    filter,
    sort: 'reservation_time',
    $autoCancel: false,
  });
  res.json({ reservations: reservations.items });
});

// POST /restaurant/reservations
router.post('/reservations', async (req, res) => {
  const { guest_name, party_size, reservation_date, reservation_time, booking_id, notes } = req.body;
  if (!guest_name || !party_size || !reservation_date || !reservation_time) {
    return res.status(400).json({ error: 'guest_name, party_size, reservation_date, reservation_time are required' });
  }

  const record = await pb.collection('restaurant_reservations').create({
    guest_name,
    party_size,
    reservation_date,
    reservation_time,
    booking_id: booking_id || '',
    status: 'confirmed',
    notes: notes || '',
  });
  res.json({ success: true, reservation: record });
});

// ===== INVENTORY =====

// GET /restaurant/inventory
router.get('/inventory', async (req, res) => {
  const items = await pb.collection('restaurant_inventory').getFullList({
    filter: 'is_active = true',
    sort: 'name',
    $autoCancel: false,
  });

  const lowStock = items.filter(i => i.quantity <= (i.min_quantity || 0));
  res.json({ inventory: items, low_stock_alerts: lowStock });
});

export default router;
