import 'dotenv/config';
import express from 'express';
import pb, { authenticateSuperuser } from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /room-allotments
router.get('/', async (req, res) => {
  const rooms = await pb.collection('rooms').getFullList();

  const roomTypes = rooms.map((room) => {
    const bookedRooms = room.total_rooms - room.available_rooms;
    const occupancyPercentage = (bookedRooms / room.total_rooms) * 100;

    return {
      id: room.id,
      name: room.name,
      total_rooms: room.total_rooms,
      available_rooms: room.available_rooms,
      booked_rooms: bookedRooms,
      occupancy_percentage: occupancyPercentage,
    };
  });

  // Sort by occupancy_percentage descending
  roomTypes.sort((a, b) => b.occupancy_percentage - a.occupancy_percentage);

  logger.info('Fetched all room allotments');
  res.json({ room_types: roomTypes });
});

// PUT /room-allotments/:roomTypeId
router.put('/:roomTypeId', authMiddleware, requireAdmin, async (req, res) => {
  const { roomTypeId } = req.params;
  const { total_rooms } = req.body;

  const isPocketBaseAuthenticated = await authenticateSuperuser();

  if (!isPocketBaseAuthenticated) {
    return res.status(503).json({
      error: 'The database is temporarily unavailable. Please try again.',
    });
  }

  // Validate required fields
  if (total_rooms === undefined) {
    return res.status(400).json({ error: 'total_rooms is required' });
  }

  if (typeof total_rooms !== 'number' || total_rooms <= 0) {
    return res.status(400).json({ error: 'total_rooms must be a positive number' });
  }

  // Fetch the room record
  const room = await pb.collection('rooms').getOne(roomTypeId);

  // Calculate currently booked rooms
  const currentlyBooked = room.total_rooms - room.available_rooms;

  // Validate: new total_rooms must be >= currently booked rooms
  if (total_rooms < currentlyBooked) {
    throw new Error(`Cannot reduce total rooms below currently booked count of ${currentlyBooked}`);
  }

  // Calculate new available_rooms
  const newAvailableRooms = total_rooms - currentlyBooked;

  // Update the room record
  const updatedRoom = await pb.collection('rooms').update(roomTypeId, {
    total_rooms: total_rooms,
    available_rooms: newAvailableRooms,
  });

  const bookedRooms = updatedRoom.total_rooms - updatedRoom.available_rooms;
  const occupancyPercentage = (bookedRooms / updatedRoom.total_rooms) * 100;

  logger.info(`Updated room allotment for room type ${roomTypeId}`);
  res.json({
    success: true,
    message: 'Room allotment updated',
    room_type: {
      id: updatedRoom.id,
      name: updatedRoom.name,
      total_rooms: updatedRoom.total_rooms,
      available_rooms: updatedRoom.available_rooms,
      booked_rooms: bookedRooms,
      occupancy_percentage: occupancyPercentage,
    },
  });
});

// GET /room-allotments/:roomTypeId/bookings
router.get('/:roomTypeId/bookings', async (req, res) => {
  const { roomTypeId } = req.params;

  // Fetch all bookings where room_type matches roomTypeId
  const bookings = await pb.collection('bookings').getFullList({
    filter: `room_type = "${roomTypeId}"`,
  });

  // Map and sort by check_in_date ascending
  const bookingDetails = bookings
    .map((booking) => ({
      id: booking.id,
      guest_name: booking.guest_name,
      guest_email: booking.guest_email,
      check_in_date: booking.check_in_date,
      check_out_date: booking.check_out_date,
      payment_status: booking.payment_status,
      number_of_guests: booking.number_of_guests,
    }))
    .sort((a, b) => new Date(a.check_in_date) - new Date(b.check_in_date));

  logger.info(`Fetched bookings for room type ${roomTypeId}`);
  res.json({ bookings: bookingDetails });
});

export default router;
