import pb from '@/lib/pocketbaseClient.js';
import { getFallbackRooms } from '@/data/fallbackRooms.js';

const ROOM_REQUEST_TIMEOUT_MS = 5000;

const normalizeRoomName = (name) => String(name || '').trim().toLowerCase();

const hydrateIncompleteRooms = (records) => {
  const fallbackByName = new Map(
    getFallbackRooms().map((room) => [normalizeRoomName(room.name), room]),
  );

  return records.map((room) => {
    const fallback = fallbackByName.get(normalizeRoomName(room.name));
    if (!fallback) return room;

    return {
      ...fallback,
      ...room,
      description: room.description || fallback.description,
      amenities: room.amenities || fallback.amenities,
      price: Number(room.price) > 0 ? Number(room.price) : fallback.price,
      capacity: Number(room.capacity) > 0 ? Number(room.capacity) : fallback.capacity,
    };
  });
};

const withTimeout = (promise, timeoutMs) =>
  new Promise((resolve, reject) => {
    const timer = window.setTimeout(
      () => reject(new Error('Room service request timed out')),
      timeoutMs,
    );

    promise.then(resolve, reject).finally(() => window.clearTimeout(timer));
  });

export async function fetchPublicRooms() {
  try {
    const records = await withTimeout(
      pb.collection('rooms').getFullList({
        sort: 'price',
        $autoCancel: false,
      }),
      ROOM_REQUEST_TIMEOUT_MS,
    );

    if (Array.isArray(records) && records.length > 0) {
      return { rooms: hydrateIncompleteRooms(records), usedFallback: false };
    }

    console.warn('The room service returned no records; showing the safe fallback catalogue.');
  } catch (error) {
    console.error('Failed to load rooms from PocketBase; showing fallback rooms:', error);
  }

  return { rooms: getFallbackRooms(), usedFallback: true };
}
