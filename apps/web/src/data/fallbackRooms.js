export const FALLBACK_ROOMS = Object.freeze([
  {
    id: 'fallback-economy-room',
    name: 'Economy Room',
    description: 'Simple, comfortable room with a private bathroom and everything needed for a relaxed stay.',
    amenities: 'WiFi, Air Conditioning, Private Bathroom',
    price: 89.99,
    capacity: 2,
  },
  {
    id: 'fallback-double-deluxe',
    name: 'Double Deluxe',
    description: 'A spacious room with modern furnishings, a private bathroom and an extra bed for a child.',
    amenities: 'WiFi, Air Conditioning, Private Bathroom, Smart TV, Mini Bar',
    price: 149.99,
    capacity: 3,
  },
  {
    id: 'fallback-luxury-suite',
    name: 'Luxury Suite',
    description: 'Our largest accommodation, with generous space for families and premium in-room comfort.',
    amenities: 'WiFi, Air Conditioning, Private Bathroom, Smart TV, Mini Bar, Lounge Area',
    price: 249.99,
    capacity: 4,
  },
]);

export const getFallbackRooms = () =>
  FALLBACK_ROOMS.map((room) => ({ ...room }));
