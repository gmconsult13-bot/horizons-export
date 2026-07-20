import { Router } from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = Router();

const getRatingColor = (rating) => {
  if (rating >= 4.5) return 'good';
  if (rating >= 3.5) return 'warning';
  return 'poor';
};

const buildFilterString = (req) => {
  const { start_date, end_date, room_type_id } = req.query;
  let filters = [];
  
  // Notice we use >= and < for dates to catch full datetime strings safely
  if (start_date) filters.push(`created_at >= "${start_date} 00:00:00"`);
  if (end_date) {
    const nextDay = new Date(end_date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];
    filters.push(`created_at < "${nextDayStr} 00:00:00"`);
  }
  // If we had room_type_id mapping via booking relations we could filter here
  // Assuming a direct relation for analytics purposes if present
  if (room_type_id && room_type_id !== 'all') filters.push(`room_type = "${room_type_id}"`);

  return filters.length > 0 ? filters.join(' && ') : '';
};

// GET /reviews-analytics/summary
router.get('/summary', async (req, res) => {
  const { start_date, end_date } = req.query;
  
  // Build filter string for optional date range
  let filter = '';
  if (start_date || end_date) {
    let filters = [];
    if (start_date) filters.push(`created_at >= "${start_date} 00:00:00"`);
    if (end_date) {
      const nextDay = new Date(end_date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      filters.push(`created_at < "${nextDayStr} 00:00:00"`);
    }
    filter = filters.join(' && ');
  }

  // Fetch all reviews from guest_reviews collection with optional filter
  const allReviews = await pb.collection('guest_reviews').getFullList({
    filter: filter || undefined,
    sort: '-created_at',
  });

  const totalReviews = allReviews.length;

  if (totalReviews === 0) {
    logger.info('Summary requested: no reviews found');
    return res.json({
      totalReviews: 0,
      averageRating: 0,
      ratingBreakdown: {
        hotel_rating: 0,
        cleaning_rating: 0,
        service_rating: 0,
        food_rating: 0,
        price_quality_rating: 0,
      },
      recentReviews: [],
    });
  }

  // Calculate sums for all rating fields
  const sums = allReviews.reduce(
    (acc, review) => {
      acc.hotel_rating += review.hotel_rating || 0;
      acc.cleaning_rating += review.cleaning_rating || 0;
      acc.service_rating += review.service_rating || 0;
      acc.food_rating += review.food_rating || 0;
      acc.price_quality_rating += review.price_quality_rating || 0;
      return acc;
    },
    {
      hotel_rating: 0,
      cleaning_rating: 0,
      service_rating: 0,
      food_rating: 0,
      price_quality_rating: 0,
    }
  );

  // Calculate averages
  const ratingBreakdown = {
    hotel_rating: parseFloat((sums.hotel_rating / totalReviews).toFixed(2)),
    cleaning_rating: parseFloat((sums.cleaning_rating / totalReviews).toFixed(2)),
    service_rating: parseFloat((sums.service_rating / totalReviews).toFixed(2)),
    food_rating: parseFloat((sums.food_rating / totalReviews).toFixed(2)),
    price_quality_rating: parseFloat((sums.price_quality_rating / totalReviews).toFixed(2)),
  };

  // Calculate overall average rating
  const totalSum =
    sums.hotel_rating +
    sums.cleaning_rating +
    sums.service_rating +
    sums.food_rating +
    sums.price_quality_rating;
  const averageRating = parseFloat((totalSum / (totalReviews * 5)).toFixed(2));

  // Get last 5 reviews (already sorted by -created_at)
  const recentReviews = allReviews.slice(0, 5).map((review) => ({
    guest_name: review.guest_name,
    hotel_rating: review.hotel_rating,
    created_at: review.created_at,
  }));

  logger.info(`Summary calculated: ${totalReviews} reviews, average rating ${averageRating}`);
  res.json({
    totalReviews,
    averageRating,
    ratingBreakdown,
    recentReviews,
  });
});

router.get('/trends', async (req, res) => {
  const filter = buildFilterString(req);
  const records = await pb.collection('guest_reviews').getFullList({
    filter: filter || undefined,
    sort: 'created_at',
    $autoCancel: false
  });

  const dailyGroups = records.reduce((acc, r) => {
    const date = r.created_at.split(' ')[0];
    if (!acc[date]) {
      acc[date] = { count: 0, hotel_rating: 0, cleaning_rating: 0, service_rating: 0, food_rating: 0, price_quality_rating: 0 };
    }
    acc[date].count++;
    acc[date].hotel_rating += r.hotel_rating;
    acc[date].cleaning_rating += r.cleaning_rating;
    acc[date].service_rating += r.service_rating;
    acc[date].food_rating += r.food_rating;
    acc[date].price_quality_rating += r.price_quality_rating;
    return acc;
  }, {});

  const trends = Object.keys(dailyGroups).sort().map(date => {
    const group = dailyGroups[date];
    return {
      date,
      hotel_rating: parseFloat((group.hotel_rating / group.count).toFixed(2)),
      cleaning_rating: parseFloat((group.cleaning_rating / group.count).toFixed(2)),
      service_rating: parseFloat((group.service_rating / group.count).toFixed(2)),
      food_rating: parseFloat((group.food_rating / group.count).toFixed(2)),
      price_quality_rating: parseFloat((group.price_quality_rating / group.count).toFixed(2))
    };
  });

  res.json({ trends });
});

router.get('/distribution', async (req, res) => {
  const filter = buildFilterString(req);
  const records = await pb.collection('guest_reviews').getFullList({
    filter: filter || undefined,
    $autoCancel: false
  });

  const initialCounts = () => ({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 });
  const distribution = {
    hotel_rating: initialCounts(),
    cleaning_rating: initialCounts(),
    service_rating: initialCounts(),
    food_rating: initialCounts(),
    price_quality_rating: initialCounts()
  };

  records.forEach(r => {
    if (r.hotel_rating) distribution.hotel_rating[r.hotel_rating]++;
    if (r.cleaning_rating) distribution.cleaning_rating[r.cleaning_rating]++;
    if (r.service_rating) distribution.service_rating[r.service_rating]++;
    if (r.food_rating) distribution.food_rating[r.food_rating]++;
    if (r.price_quality_rating) distribution.price_quality_rating[r.price_quality_rating]++;
  });

  res.json({ distribution });
});

router.get('/comparison', async (req, res) => {
  const { current_start, current_end, prev_start, prev_end, room_type_id } = req.query;

  const buildQuery = (start, end) => {
    let q = [];
    if (start) q.push(`created_at >= "${start} 00:00:00"`);
    if (end) {
      const d = new Date(end);
      d.setDate(d.getDate() + 1);
      q.push(`created_at < "${d.toISOString().split('T')[0]} 00:00:00"`);
    }
    if (room_type_id && room_type_id !== 'all') q.push(`room_type = "${room_type_id}"`);
    return q.join(' && ');
  };

  const [currentRecords, prevRecords] = await Promise.all([
    pb.collection('guest_reviews').getFullList({ filter: buildQuery(current_start, current_end) || undefined, $autoCancel: false }),
    pb.collection('guest_reviews').getFullList({ filter: buildQuery(prev_start, prev_end) || undefined, $autoCancel: false })
  ]);

  const calcAvgs = (records) => {
    if (records.length === 0) return { hotel_rating: 0, cleaning_rating: 0, service_rating: 0, food_rating: 0, price_quality_rating: 0 };
    const sums = records.reduce((acc, r) => {
      acc.hotel_rating += r.hotel_rating || 0;
      acc.cleaning_rating += r.cleaning_rating || 0;
      acc.service_rating += r.service_rating || 0;
      acc.food_rating += r.food_rating || 0;
      acc.price_quality_rating += r.price_quality_rating || 0;
      return acc;
    }, { hotel_rating: 0, cleaning_rating: 0, service_rating: 0, food_rating: 0, price_quality_rating: 0 });

    return {
      hotel_rating: sums.hotel_rating / records.length,
      cleaning_rating: sums.cleaning_rating / records.length,
      service_rating: sums.service_rating / records.length,
      food_rating: sums.food_rating / records.length,
      price_quality_rating: sums.price_quality_rating / records.length,
    };
  };

  const currAvgs = calcAvgs(currentRecords);
  const prevAvgs = calcAvgs(prevRecords);

  const calculateChange = (curr, prev) => {
    if (prev === 0) return { change: curr, pct_change: curr > 0 ? 100 : 0 };
    const change = curr - prev;
    const pct_change = (change / prev) * 100;
    return { change, pct_change };
  };

  const categories = ['hotel_rating', 'cleaning_rating', 'service_rating', 'food_rating', 'price_quality_rating'];
  const comparison = {};

  categories.forEach(cat => {
    comparison[cat] = {
      current: currAvgs[cat],
      prev: prevAvgs[cat],
      ...calculateChange(currAvgs[cat], prevAvgs[cat])
    };
  });

  res.json({ comparison });
});

export default router;